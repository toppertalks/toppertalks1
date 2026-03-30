import logging
import time
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models.session import SessionEnd, SessionReport, SessionStart
from orm_models import Report, Session, Topper, Transaction, Wallet

_logger = logging.getLogger("toppertalks")

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

MIN_CHARGE = 50       # ₹50 for first 5 min
RATE_PER_MIN = 10     # ₹10/min after 5 min
FREE_MINUTES = 5
TOPPER_SHARE = 0.6    # 60%
PLATFORM_SHARE = 0.4  # 40%


@router.post("/start")
async def start_session(
    body: SessionStart,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    uid = user["uid"]

    # Check student wallet balance
    wallet_result = await db.execute(select(Wallet).where(Wallet.uid == uid))
    wallet = wallet_result.scalar_one_or_none()
    balance = wallet.balance if wallet else 0.0

    if balance < MIN_CHARGE:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient balance. Minimum ₹{MIN_CHARGE} required.",
        )

    # Get topper info
    topper_result = await db.execute(select(Topper).where(Topper.uid == body.topperId))
    topper = topper_result.scalar_one_or_none()
    if not topper:
        raise HTTPException(status_code=404, detail="Topper not found")

    # Fetch topper name from linked user
    from orm_models import User as UserModel
    user_result = await db.execute(select(UserModel).where(UserModel.id == body.topperId))
    topper_user = user_result.scalar_one_or_none()
    topper_name = topper_user.name if topper_user else ""

    session_id = str(uuid.uuid4())
    new_session = Session(
        session_id=session_id,
        student_uid=uid,
        topper_id=body.topperId,
        topper_name=topper_name,
        start_time=time.time(),
        status="active",
    )
    db.add(new_session)
    await db.commit()
    _logger.info('"Session started — session_id=%s student=%s topper=%s"', session_id, uid, body.topperId)
    return {"sessionId": session_id, "topperName": topper_name}


@router.post("/end")
async def end_session(
    body: SessionEnd,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    uid = user["uid"]

    result = await db.execute(select(Session).where(Session.session_id == body.sessionId))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status != "active":
        raise HTTPException(status_code=400, detail="Session is not active")
    if uid != session.student_uid and uid != session.topper_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    end_time = time.time()
    duration_seconds = int(end_time - session.start_time)
    duration_minutes = duration_seconds / 60

    if duration_minutes <= FREE_MINUTES:
        amount_charged = float(MIN_CHARGE)
    else:
        amount_charged = MIN_CHARGE + (duration_minutes - FREE_MINUTES) * RATE_PER_MIN

    amount_charged = round(amount_charged, 2)
    topper_earns = round(amount_charged * TOPPER_SHARE, 2)
    platform_fee = round(amount_charged * PLATFORM_SHARE, 2)

    # Update session record
    await db.execute(
        update(Session)
        .where(Session.session_id == body.sessionId)
        .values(
            end_time=end_time,
            duration_seconds=duration_seconds,
            amount_charged=amount_charged,
            student_pays=amount_charged,
            topper_earns=topper_earns,
            platform_fee=platform_fee,
            status="completed",
        )
    )

    # Deduct from student wallet (upsert)
    student_wallet_r = await db.execute(
        select(Wallet).where(Wallet.uid == session.student_uid)
    )
    student_wallet = student_wallet_r.scalar_one_or_none()
    if student_wallet:
        await db.execute(
            update(Wallet)
            .where(Wallet.uid == session.student_uid)
            .values(balance=student_wallet.balance - amount_charged)
        )
    # Add student transaction
    db.add(
        Transaction(
            id=str(uuid.uuid4()),
            user_uid=session.student_uid,
            type="call",
            amount=-amount_charged,
            description=f"Call with {session.topper_name or 'Topper'}",
            session_id=body.sessionId,
        )
    )

    # Credit topper wallet (upsert)
    topper_wallet_r = await db.execute(
        select(Wallet).where(Wallet.uid == session.topper_id)
    )
    topper_wallet = topper_wallet_r.scalar_one_or_none()
    if topper_wallet:
        await db.execute(
            update(Wallet)
            .where(Wallet.uid == session.topper_id)
            .values(balance=topper_wallet.balance + topper_earns)
        )
    else:
        db.add(Wallet(uid=session.topper_id, balance=topper_earns))
    # Add topper transaction
    db.add(
        Transaction(
            id=str(uuid.uuid4()),
            user_uid=session.topper_id,
            type="call",
            amount=topper_earns,
            description="Earnings from session",
            session_id=body.sessionId,
        )
    )

    # Increment topper session count
    await db.execute(
        update(Topper)
        .where(Topper.uid == session.topper_id)
        .values(total_sessions=Topper.total_sessions + 1)
    )

    await db.commit()
    _logger.info(
        '"Session ended — session_id=%s duration=%ds charged=%.2f topper_earns=%.2f"',
        body.sessionId, duration_seconds, amount_charged, topper_earns,
    )
    return {"durationSeconds": duration_seconds, "amountCharged": amount_charged}


@router.post("/report")
async def report_session(
    body: SessionReport,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    uid = user["uid"]

    result = await db.execute(select(Session).where(Session.session_id == body.sessionId))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if uid != session.student_uid and uid != session.topper_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.execute(
        update(Session)
        .where(Session.session_id == body.sessionId)
        .values(status="reported", report_reason=body.reason)
    )

    report_id = str(uuid.uuid4())
    db.add(
        Report(
            report_id=report_id,
            session_id=body.sessionId,
            reported_by=uid,
            reason=body.reason,
        )
    )
    await db.commit()
    _logger.warning('"Session reported — session_id=%s reported_by=%s reason=%s"', body.sessionId, uid, body.reason)
    return {"success": True, "reportId": report_id}


@router.get("")
async def get_sessions(
    role: str = Query("student"),
    limit: int = Query(20, le=100),
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    uid = user["uid"]

    if role == "topper":
        stmt = (
            select(Session)
            .where(Session.topper_id == uid)
            .order_by(Session.start_time.desc())
            .limit(limit)
        )
    else:
        stmt = (
            select(Session)
            .where(Session.student_uid == uid)
            .order_by(Session.start_time.desc())
            .limit(limit)
        )

    result = await db.execute(stmt)
    sessions = result.scalars().all()

    return {
        "sessions": [
            {
                "sessionId": s.session_id,
                "studentUID": s.student_uid,
                "topperId": s.topper_id,
                "topperName": s.topper_name,
                "startTime": str(s.start_time),
                "endTime": str(s.end_time) if s.end_time else None,
                "durationSeconds": s.duration_seconds,
                "amountCharged": s.amount_charged,
                "studentPays": s.student_pays,
                "topperEarns": s.topper_earns,
                "platformFee": s.platform_fee,
                "status": s.status,
            }
            for s in sessions
        ]
    }
