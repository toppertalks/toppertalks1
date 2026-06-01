from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.topper import Topper
from app.models.user import User

router = APIRouter(prefix="/toppers", tags=["toppers"])


class TopperOut(BaseModel):
    uid: str
    name: str
    college: Optional[str] = None
    branch: Optional[str] = None
    year: Optional[str] = None
    rank: Optional[str] = None
    examCleared: Optional[str] = None
    subjects: list[str] = []
    bio: Optional[str] = None
    rating: float = 0.0
    totalSessions: int = 0
    isOnline: bool = False
    avatarUrl: Optional[str] = None


class TopperListResponse(BaseModel):
    toppers: list[TopperOut]
    cached: bool = False


class StatusUpdate(BaseModel):
    isOnline: bool


def _serialize(t: Topper, name: str) -> TopperOut:
    return TopperOut(
        uid=str(t.uid),
        name=name,
        college=t.college,
        branch=t.branch,
        year=t.year,
        rank=t.rank,
        examCleared=t.exam_cleared,
        subjects=list(t.subjects or []),
        bio=t.bio,
        rating=t.rating,
        totalSessions=t.total_sessions,
        isOnline=t.is_online,
        avatarUrl=t.avatar_url,
    )


@router.get("", response_model=TopperListResponse)
async def list_toppers(
    exam: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Topper, User).join(User, User.id == Topper.uid).limit(limit)
    if exam:
        stmt = stmt.where(Topper.exam_cleared == exam)
    rows = (await db.execute(stmt)).all()
    return TopperListResponse(
        toppers=[_serialize(t, u.full_name or u.email) for (t, u) in rows]
    )


@router.get("/{topper_id}", response_model=TopperOut)
async def get_topper(topper_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(Topper, User).join(User, User.id == Topper.uid).where(Topper.uid == topper_id)
    row = (await db.execute(stmt)).first()
    if not row:
        raise HTTPException(status_code=404, detail="Topper not found")
    t, u = row
    return _serialize(t, u.full_name or u.email)


@router.patch("/{topper_id}/status")
async def update_status(
    topper_id: uuid.UUID,
    body: StatusUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    if user.id != topper_id and not user.is_superuser:
        raise HTTPException(status_code=403, detail="Forbidden")
    topper = await db.get(Topper, topper_id)
    if not topper:
        raise HTTPException(status_code=404, detail="Topper not found")
    topper.is_online = body.isOnline
    await db.commit()
    return {"success": True, "isOnline": topper.is_online}


class BecomeTopperBody(BaseModel):
    college: Optional[str] = None
    branch: Optional[str] = None
    year: Optional[str] = None
    rank: Optional[str] = None
    examCleared: Optional[str] = None
    subjects: list[str] = []
    bio: Optional[str] = None


@router.post("/me", response_model=TopperOut, status_code=status.HTTP_201_CREATED)
async def upsert_my_topper_profile(
    body: BecomeTopperBody,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    """Create or update the topper profile for the current user."""
    stmt = insert(Topper).values(
        uid=user.id,
        college=body.college,
        branch=body.branch,
        year=body.year,
        rank=body.rank,
        exam_cleared=body.examCleared,
        subjects=body.subjects,
        bio=body.bio,
    ).on_conflict_do_update(
        index_elements=["uid"],
        set_={
            "college": body.college,
            "branch": body.branch,
            "year": body.year,
            "rank": body.rank,
            "exam_cleared": body.examCleared,
            "subjects": body.subjects,
            "bio": body.bio,
        },
    )
    await db.execute(stmt)
    user.role = "topper"
    await db.commit()
    topper = await db.get(Topper, user.id)
    return _serialize(topper, user.full_name or user.email)
