from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.user import User

router = APIRouter(prefix="/user", tags=["user-profile"])


class UserProfileResponse(BaseModel):
    uid: str
    email: str
    name: str | None = None
    role: str
    examMode: str
    avatarUrl: str | None = None
    emailVerified: bool


class UserProfileUpdate(BaseModel):
    name: str | None = None
    role: str = Field(default="student", pattern="^(student|topper)$")
    examMode: str = Field(default="JEE", pattern="^(JEE|NEET)$")
    avatarUrl: str | None = None


@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(user: User = Depends(get_current_active_user)):
    return UserProfileResponse(
        uid=str(user.id),
        email=user.email,
        name=user.full_name,
        role=user.role,
        examMode=user.exam_mode,
        avatarUrl=user.avatar_url,
        emailVerified=user.is_verified,
    )


@router.post("/profile")
async def update_profile(
    body: UserProfileUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    if body.name is not None:
        user.full_name = body.name
    user.role = body.role
    user.exam_mode = body.examMode
    if body.avatarUrl is not None:
        user.avatar_url = body.avatarUrl
    await db.commit()
    return {"success": True, "uid": str(user.id)}
