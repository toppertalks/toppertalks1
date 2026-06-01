from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import get_current_active_user, require_permissions, require_roles
from app.models.user import User
from app.schemas.auth import MessageResponse, UserPublic

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserPublic)
async def read_me(user: User = Depends(get_current_active_user)) -> UserPublic:
    return UserPublic.model_validate(
        {
            **user.__dict__,
            "role_names": user.role_names,
            "permission_codes": user.permission_codes,
        }
    )


@router.get(
    "/admin-only",
    response_model=MessageResponse,
    dependencies=[Depends(require_roles("ADMIN", "SUPER_ADMIN"))],
)
async def admin_only() -> MessageResponse:
    return MessageResponse(message="Welcome, admin")


@router.get(
    "/reports",
    response_model=MessageResponse,
    dependencies=[Depends(require_permissions("report:view"))],
)
async def view_reports() -> MessageResponse:
    return MessageResponse(message="Report data")
