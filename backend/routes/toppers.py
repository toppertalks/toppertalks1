from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from cache import cache_delete, cache_get, cache_set
from database import get_db, get_read_db
from orm_models import Topper

router = APIRouter(prefix="/api/toppers", tags=["toppers"])

# Cache TTLs
_LIST_TTL = 30     # seconds — short because is_online changes frequently
_PROFILE_TTL = 300 # seconds — invalidated explicitly on status change


def _topper_dict(t: Topper) -> dict:
    return {
        "uid": t.uid,
        "college": t.college,
        "branch": t.branch,
        "year": t.year,
        "rank": t.rank,
        "examCleared": t.exam_cleared,
        "subjects": t.subjects or [],
        "bio": t.bio,
        "rating": t.rating,
        "totalSessions": t.total_sessions,
        "isOnline": t.is_online,
        "avatarUrl": t.avatar_url,
    }


@router.get("")
async def get_toppers(
    exam: Optional[str] = Query(None),
    limit: int = Query(20, le=100),
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_read_db),
):
    # Cache key varies by exam filter and limit so different requests get
    # their own cached slice. TTL is short (30 s) so online-status changes
    # propagate quickly without expensive per-key invalidation.
    cache_key = f"toppers:list:{exam or 'all'}:{limit}"
    cached = await cache_get(cache_key)
    if cached is not None:
        return {"toppers": cached, "cached": True}

    stmt = select(Topper)
    if exam:
        stmt = stmt.where(Topper.exam_cleared == exam)
    stmt = stmt.limit(limit)

    result = await db.execute(stmt)
    toppers = [_topper_dict(t) for t in result.scalars().all()]

    await cache_set(cache_key, toppers, ttl=_LIST_TTL)
    return {"toppers": toppers, "cached": False}


@router.get("/{topper_id}")
async def get_topper(
    topper_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_read_db),
):
    cache_key = f"topper:profile:{topper_id}"
    cached = await cache_get(cache_key)
    if cached is not None:
        return {**cached, "cached": True}

    result = await db.execute(select(Topper).where(Topper.uid == topper_id))
    topper = result.scalar_one_or_none()
    if not topper:
        raise HTTPException(status_code=404, detail="Topper not found")

    data = _topper_dict(topper)
    await cache_set(cache_key, data, ttl=_PROFILE_TTL)
    return {**data, "cached": False}


@router.patch("/{topper_id}/status")
async def update_topper_status(
    topper_id: str,
    body: dict,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    uid = user.get("uid")
    if uid != topper_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    is_online = body.get("isOnline", False)
    await db.execute(
        update(Topper).where(Topper.uid == topper_id).values(is_online=is_online)
    )
    await db.commit()

    # Invalidate the individual profile cache so the updated status is
    # immediately visible. The list cache self-expires via its short TTL.
    await cache_delete(f"topper:profile:{topper_id}")

