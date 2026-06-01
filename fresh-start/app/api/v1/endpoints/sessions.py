from __future__ import annotations

import time
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.session import CallSession
from app.models.topper import Topper
from app.models.user import User
from app.models.wallet import Transaction, Wallet

router = APIRouter(prefix="/sessions", tags=["sessions"])

PLATFORM_SHARE = 0.40
TOPPER_SHARE = 0.60
FLAT_FEE = 50.0
FLAT_MINUTES = 5
PER_MINUTE_AFTER = 10.0


def compute_charge(duration_seconds: int) -> tuple[float, float, float]:
    minutes = duration_seconds / 60.0
    if minutes <= FLAT_MINUTES:
        amount = FLAT_FEE
    else:
        amount = FLAT_FEE + (minutes - FLAT_MINUTES) * PER_MINUTE_AFTER
    amount = round(amount, 2)
    topper_earns = round(amount * TOPPER_SHARE, 2)
    platform_fee = round(amount - topper_earns, 2)
    return amount, topper_earns, platform_fee


class SessionStart(BaseModel):
    topperId: uuid.UUID


class SessionEnd(BaseModel):
    sessionId: uuid.UUID


class SessionReport(BaseModel):
    sessionId: uuid.UUID
    reason: str


class SessionStartResponse(BaseModel):
    sessionId: str
    topperName: str
    livekitToken: Optional[str] = None
    livekitUrl: Optional[str] = None
    roomName: str


class SessionEndResponse(BaseModel):
    durationSeconds: int
    amountCharged: float
    alreadySettled: bool = False


@router.post("/start", response_model=SessionStartResponse)
async def start_session(
    body: SessionStart,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    topper_user = await db.get(User, body.topperId)
    if not topper_user:
        raise HTTPException(status_code=404, detail="Topper not found")

    sess = CallSession(
        session_id=uuid.uuid4(),
        student_uid=user.id,
        topper_id=body.topperId,
        topper_name=topper_user.full_name or topper_user.email,
        start_time=time.time(),
        status="active",
    )
    db.add(sess)
    await db.commit()
    return SessionStartResponse(
        sessionId=str(sess.session_id),
        topperName=sess.topper_name or "",
        livekitToken=None,
        livekitUrl=None,
        roomName=f"tt_{sess.session_id}",
    )


@router.post("/end", response_model=SessionEndResponse)
async def end_session(
    body: SessionEnd,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    sess = await db.get(CallSession, body.sessionId)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    if sess.status != "active":
        return SessionEndResponse(
            durationSeconds=sess.duration_seconds,
            amountCharged=sess.amount_charged,
            alreadySettled=True,
        )
    if user.id not in (sess.student_uid, sess.topper_id) and not user.is_superuser:
        raise HTTPException(status_code=403, detail="Forbidden")

    end_time = time.time()
    duration = max(int(end_time - sess.start_time), 0)
    amount, topper_earns, platform_fee = compute_charge(duration)

    # Atomic settlement
    result = await db.execute(
        update(CallSession)
        .where(CallSession.session_id == sess.session_id, CallSession.status == "active")
        .values(
            end_time=end_time,
            duration_seconds=duration,
            amount_charged=amount,
            student_pays=amount,
            topper_earns=topper_earns,
            platform_fee=platform_fee,
            status="completed",
        )
    )
    if result.rowcount == 0:
        await db.rollback()
        await db.refresh(sess)
        return SessionEndResponse(
            durationSeconds=sess.duration_seconds,
            amountCharged=sess.amount_charged,
            alreadySettled=True,
        )

    # Wallet updates
    if sess.student_uid:
        student_wallet = await db.get(Wallet, sess.student_uid)
        if not student_wallet:
            student_wallet = Wallet(uid=sess.student_uid, balance=0.0)
            db.add(student_wallet)
        student_wallet.balance -= amount
        db.add(Transaction(
            user_uid=sess.student_uid,
            type="call",
            amount=-amount,
            description=f"Call with {sess.topper_name}",
            session_id=sess.session_id,
        ))
    if sess.topper_id:
        topper_wallet = await db.get(Wallet, sess.topper_id)
        if not topper_wallet:
            topper_wallet = Wallet(uid=sess.topper_id, balance=0.0)
            db.add(topper_wallet)
        topper_wallet.balance += topper_earns
        db.add(Transaction(
            user_uid=sess.topper_id,
            type="call",
            amount=topper_earns,
            description="Topper earnings",
            session_id=sess.session_id,
        ))
        topper = await db.get(Topper, sess.topper_id)
        if topper:
            topper.total_sessions += 1

    await db.commit()
    return SessionEndResponse(durationSeconds=duration, amountCharged=amount)


@router.post("/report")
async def report_session(
    body: SessionReport,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    sess = await db.get(CallSession, body.sessionId)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    if user.id not in (sess.student_uid, sess.topper_id):
        raise HTTPException(status_code=403, detail="Forbidden")
    sess.report_reason = body.reason
    sess.status = "reported"
    await db.commit()
    return {"success": True, "reportId": str(sess.session_id)}


@router.get("")
async def list_my_sessions(
    role: str = "student",
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    column = CallSession.student_uid if role == "student" else CallSession.topper_id
    stmt = select(CallSession).where(column == user.id).order_by(CallSession.created_at.desc()).limit(100)
    rows = (await db.execute(stmt)).scalars().all()
    return {
        "sessions": [
            {
                "sessionId": str(s.session_id),
                "studentUid": str(s.student_uid) if s.student_uid else None,
                "topperId": str(s.topper_id) if s.topper_id else None,
                "topperName": s.topper_name,
                "durationSeconds": s.duration_seconds,
                "amountCharged": s.amount_charged,
                "topperEarns": s.topper_earns,
                "status": s.status,
                "createdAt": s.created_at.isoformat() if s.created_at else None,
            }
            for s in rows
        ]
    }
