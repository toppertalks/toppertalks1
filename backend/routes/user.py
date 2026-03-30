import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models.user import UserProfileCreate
from orm_models import User

_logger = logging.getLogger("toppertalks")

router = APIRouter(prefix="/api/user", tags=["user"])


@router.get("/profile")
async def get_profile(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    uid = user["uid"]
    result = await db.execute(select(User).where(User.id == uid))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    return {
        "uid": profile.id,
        "name": profile.name,
        "email": profile.email,
        "role": profile.role,
        "examMode": profile.exam_mode,
        "avatarUrl": profile.avatar_url,
    }


@router.post("/profile")
async def create_or_update_profile(
    body: UserProfileCreate,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    uid = user["uid"]
    now = datetime.now(timezone.utc)

    stmt = (
        pg_insert(User)
        .values(
            id=uid,
            email=user.get("email", ""),
            name=body.name,
            role=body.role,
            exam_mode=body.examMode,
            created_at=now,
            updated_at=now,
        )
        .on_conflict_do_update(
            index_elements=["id"],
            set_={
                "name": body.name,
                "role": body.role,
                "exam_mode": body.examMode,
                "updated_at": now,
            },
        )
    )
    await db.execute(stmt)
    await db.commit()
    _logger.info('"User profile upserted — uid=%s role=%s"', uid, body.role)
    return {"success": True, "uid": uid}

