import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from cache import cache_delete_pattern, cache_get, cache_set
from database import get_db, get_read_db
from models.rating import RatingCreate
from orm_models import Rating, Session, Topper

_logger = logging.getLogger("toppertalks")

router = APIRouter(prefix="/api/ratings", tags=["ratings"])

_RATINGS_TTL = 300  # seconds


@router.post("")
async def create_rating(
    body: RatingCreate,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    uid = user["uid"]

    session_result = await db.execute(
        select(Session).where(Session.session_id == body.sessionId)
    )
    session = session_result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if uid != session.student_uid and uid != session.topper_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    to_uid = session.topper_id if uid == session.student_uid else session.student_uid

    dup_result = await db.execute(
        select(Rating)
        .where(Rating.session_id == body.sessionId)
        .where(Rating.from_uid == uid)
        .limit(1)
    )
    if dup_result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already rated this session")

    rating_id = str(uuid.uuid4())
    db.add(
        Rating(
            rating_id=rating_id,
            session_id=body.sessionId,
            from_uid=uid,
            to_uid=to_uid,
            stars=body.stars,
            comment=body.comment,
        )
    )
    await db.flush()

    avg_result = await db.execute(
        select(func.avg(Rating.stars), func.count(Rating.rating_id)).where(
            Rating.to_uid == to_uid
        )
    )
    avg_stars, count = avg_result.one()
    if avg_stars is not None:
        await db.execute(
            update(Topper)
            .where(Topper.uid == to_uid)
            .values(rating=round(float(avg_stars), 2))
        )

    await db.commit()

    # Invalidate all cached rating pages for this topper so the new rating
    # appears immediately on the next request.
    await cache_delete_pattern(f"ratings:{to_uid}:*")
    _logger.info('"Rating created — rating_id=%s from=%s to=%s stars=%s"', rating_id, uid, to_uid, body.stars)
    return {"ratingId": rating_id}


@router.get("")
async def get_ratings(
    topperId: str = Query(...),
    limit: int = Query(20, le=100),
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_read_db),
):
    cache_key = f"ratings:{topperId}:{limit}"
    cached = await cache_get(cache_key)
    if cached is not None:
        return {"ratings": cached, "cached": True}

    result = await db.execute(
        select(Rating)
        .where(Rating.to_uid == topperId)
        .order_by(Rating.created_at.desc())
        .limit(limit)
    )
    ratings = [
        {
            "ratingId": r.rating_id,
            "sessionId": r.session_id,
            "fromUID": r.from_uid,
            "toUID": r.to_uid,
            "stars": r.stars,
            "comment": r.comment,
            "createdAt": r.created_at.isoformat() + "Z" if r.created_at else None,
        }
        for r in result.scalars().all()
    ]

    await cache_set(cache_key, ratings, ttl=_RATINGS_TTL)
    return {"ratings": ratings, "cached": False}
