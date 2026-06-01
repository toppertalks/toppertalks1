from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permissions
from app.db.session import get_db
from app.models.permission import Permission
from app.models.role import Role
from app.schemas.admin import (
    RoleCreate,
    RolePermissionsUpdate,
    RoleRead,
    RoleUpdate,
)

PROTECTED_ROLES = {"SUPER_ADMIN"}

router = APIRouter(prefix="/admin/roles", tags=["admin:roles"])


async def _load_perms(db: AsyncSession, ids: list[int]) -> list[Permission]:
    if not ids:
        return []
    rows = (
        await db.execute(select(Permission).where(Permission.id.in_(ids)))
    ).scalars().all()
    if len(rows) != len(set(ids)):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Unknown permission id(s)")
    return list(rows)


@router.get(
    "",
    response_model=list[RoleRead],
    dependencies=[Depends(require_permissions("role:read"))],
)
async def list_roles(db: AsyncSession = Depends(get_db)) -> list[RoleRead]:
    rows = (await db.execute(select(Role).order_by(Role.name))).scalars().all()
    return [RoleRead.model_validate(r) for r in rows]


@router.get(
    "/{role_id}",
    response_model=RoleRead,
    dependencies=[Depends(require_permissions("role:read"))],
)
async def get_role(role_id: int, db: AsyncSession = Depends(get_db)) -> RoleRead:
    role = await db.get(Role, role_id)
    if role is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Role not found")
    return RoleRead.model_validate(role)


@router.post(
    "",
    response_model=RoleRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permissions("role:create"))],
)
async def create_role(
    data: RoleCreate, db: AsyncSession = Depends(get_db)
) -> RoleRead:
    perms = await _load_perms(db, data.permission_ids)
    role = Role(name=data.name.upper(), description=data.description, permissions=perms)
    db.add(role)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Role name already exists")
    await db.refresh(role)
    return RoleRead.model_validate(role)


@router.patch(
    "/{role_id}",
    response_model=RoleRead,
    dependencies=[Depends(require_permissions("role:update"))],
)
async def update_role(
    role_id: int,
    data: RoleUpdate,
    db: AsyncSession = Depends(get_db),
) -> RoleRead:
    role = await db.get(Role, role_id)
    if role is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Role not found")
    if data.description is not None:
        role.description = data.description
    await db.commit()
    await db.refresh(role)
    return RoleRead.model_validate(role)


@router.put(
    "/{role_id}/permissions",
    response_model=RoleRead,
    dependencies=[Depends(require_permissions("role:assign_permission"))],
)
async def set_role_permissions(
    role_id: int,
    data: RolePermissionsUpdate,
    db: AsyncSession = Depends(get_db),
) -> RoleRead:
    role = await db.get(Role, role_id)
    if role is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Role not found")
    role.permissions = await _load_perms(db, data.permission_ids)
    await db.commit()
    await db.refresh(role)
    return RoleRead.model_validate(role)


@router.delete(
    "/{role_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permissions("role:delete"))],
)
async def delete_role(role_id: int, db: AsyncSession = Depends(get_db)) -> None:
    role = await db.get(Role, role_id)
    if role is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Role not found")
    if role.name in PROTECTED_ROLES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Role is protected")
    await db.delete(role)
    await db.commit()
