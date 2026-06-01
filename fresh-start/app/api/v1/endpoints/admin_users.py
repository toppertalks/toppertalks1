from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    client_ip,
    client_user_agent,
    get_current_active_user,
    require_permissions,
)
from app.core.security import hash_password
from app.db.session import get_db
from app.models.role import Role
from app.models.user import User
from app.schemas.admin import (
    PaginatedUsers,
    UserAdminCreate,
    UserAdminRead,
    UserAdminUpdate,
    UserRolesUpdate,
)
from app.services.audit_service import AuditService
from app.services.token_service import TokenService

router = APIRouter(prefix="/admin/users", tags=["admin:users"])


async def _load_roles(db: AsyncSession, ids: list[int]) -> list[Role]:
    if not ids:
        return []
    rows = (await db.execute(select(Role).where(Role.id.in_(ids)))).scalars().all()
    if len(rows) != len(set(ids)):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Unknown role id(s)")
    return list(rows)


@router.get(
    "",
    response_model=PaginatedUsers,
    dependencies=[Depends(require_permissions("user:read"))],
)
async def list_users(
    q: Optional[str] = Query(None, description="Search by email/username/full_name"),
    is_active: Optional[bool] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> PaginatedUsers:
    stmt = select(User)
    count_stmt = select(func.count(User.id))
    if q:
        like = f"%{q.lower()}%"
        stmt = stmt.where(
            (func.lower(User.email).like(like))
            | (func.lower(User.username).like(like))
            | (func.lower(User.full_name).like(like))
        )
        count_stmt = count_stmt.where(
            (func.lower(User.email).like(like))
            | (func.lower(User.username).like(like))
            | (func.lower(User.full_name).like(like))
        )
    if is_active is not None:
        stmt = stmt.where(User.is_active.is_(is_active))
        count_stmt = count_stmt.where(User.is_active.is_(is_active))

    total = (await db.execute(count_stmt)).scalar_one()
    stmt = stmt.order_by(User.created_at.desc()).offset(skip).limit(limit)
    items = (await db.execute(stmt)).scalars().all()
    return PaginatedUsers(
        total=total, items=[UserAdminRead.model_validate(u) for u in items]
    )


@router.get(
    "/{user_id}",
    response_model=UserAdminRead,
    dependencies=[Depends(require_permissions("user:read"))],
)
async def get_user(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> UserAdminRead:
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return UserAdminRead.model_validate(user)


@router.post(
    "",
    response_model=UserAdminRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permissions("user:create"))],
)
async def create_user(
    data: UserAdminCreate, db: AsyncSession = Depends(get_db)
) -> UserAdminRead:
    roles = await _load_roles(db, data.role_ids)
    user = User(
        email=data.email.lower(),
        username=data.username,
        full_name=data.full_name,
        hashed_password=hash_password(data.password),
        is_active=data.is_active,
        is_verified=data.is_verified,
        is_superuser=data.is_superuser,
        roles=roles,
    )
    db.add(user)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Email or username already in use")
    await db.refresh(user)
    return UserAdminRead.model_validate(user)


@router.patch(
    "/{user_id}",
    response_model=UserAdminRead,
    dependencies=[Depends(require_permissions("user:update"))],
)
async def update_user(
    user_id: uuid.UUID,
    data: UserAdminUpdate,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(get_current_active_user),
) -> UserAdminRead:
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    # Don't let a non-superuser elevate themselves or others to superuser
    if data.is_superuser is not None and not actor.is_superuser:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only superusers can change superuser flag")

    for field in ("full_name", "username", "is_active", "is_verified", "is_superuser"):
        value = getattr(data, field)
        if value is not None:
            setattr(user, field, value)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Username conflict")
    await db.refresh(user)
    return UserAdminRead.model_validate(user)


@router.put(
    "/{user_id}/roles",
    response_model=UserAdminRead,
    dependencies=[Depends(require_permissions("user:assign_role"))],
)
async def set_user_roles(
    user_id: uuid.UUID,
    data: UserRolesUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(get_current_active_user),
) -> UserAdminRead:
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    user.roles = await _load_roles(db, data.role_ids)
    await db.commit()
    await db.refresh(user)

    await AuditService(db).log(
        event="ROLE_CHANGE",
        user_id=actor.id,
        ip_address=client_ip(request),
        user_agent=client_user_agent(request),
        meta={"target_user_id": str(user.id), "role_ids": data.role_ids},
    )
    # Force re-login so new permissions take effect in fresh JWTs
    await TokenService(db).revoke_all_for_user(user.id)
    return UserAdminRead.model_validate(user)


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permissions("user:delete"))],
)
async def delete_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(get_current_active_user),
) -> None:
    if user_id == actor.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot delete yourself")
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    if user.is_superuser and not actor.is_superuser:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only superusers can delete superusers")
    await db.delete(user)
    await db.commit()
