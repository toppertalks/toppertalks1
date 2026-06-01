from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.rating import Rating
from app.models.session import CallSession
from app.models.topper import Topper
from app.models.user import User

router = APIRouter(prefix="/ratings", tags=["ratings"])


class RatingCreate(BaseModel):
    sessionId: uuid.UUID
    stars: int = Field(..., ge=1, le=5)
    comment: str = ""


@router.post("")
async def create_rating(
    body: RatingCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    sess = await db.get(CallSession, body.sessionId)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    if user.id not in (sess.student_uid, sess.topper_id):
        raise HTTPException(status_code=403, detail="Forbidden")

    # Duplicate check
    existing = (
        await db.execute(
            select(Rating).where(
                Rating.session_id == body.sessionId,
                Rating.from_uid == user.id,
            )
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Already rated this session")

    to_uid = sess.topper_id if user.id == sess.student_uid else sess.student_uid
    rating = Rating(
        session_id=body.sessionId,
        from_uid=user.id,
        to_uid=to_uid,
        stars=body.stars,
        comment=body.comment,
    )
    db.add(rating)
    await db.flush()

    # Recalculate avg rating for the topper
    if to_uid:
        avg = (
            await db.execute(
                select(func.avg(Rating.stars)).where(Rating.to_uid == to_uid)
            )
        ).scalar()
        topper = await db.get(Topper, to_uid)
        if topper and avg is not None:
            topper.rating = round(float(avg), 2)

    await db.commit()
    return {"ratingId": str(rating.rating_id)}


@router.get("")
async def list_ratings(
    topperId: uuid.UUID = Query(...),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Rating, User)
        .outerjoin(User, User.id == Rating.from_uid)
        .where(Rating.to_uid == topperId)
        .order_by(Rating.created_at.desc())
        .limit(limit)
    )
    rows = (await db.execute(stmt)).all()
    return {
        "ratings": [
            {
                "ratingId": str(r.rating_id),
                "sessionId": str(r.session_id),
                "stars": r.stars,
                "comment": r.comment,
                "fromName": (u.full_name or u.email) if u else "Anonymous",
                "createdAt": r.created_at.isoformat() if r.created_at else None,
            }
            for (r, u) in rows
        ]
    }
