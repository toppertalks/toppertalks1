from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permissions
from app.db.session import get_db
from app.models.permission import Permission
from app.schemas.admin import PermissionCreate, PermissionRead, PermissionUpdate

router = APIRouter(prefix="/admin/permissions", tags=["admin:permissions"])


@router.get(
    "",
    response_model=list[PermissionRead],
    dependencies=[Depends(require_permissions("permission:read"))],
)
async def list_permissions(db: AsyncSession = Depends(get_db)) -> list[PermissionRead]:
    rows = (await db.execute(select(Permission).order_by(Permission.code))).scalars().all()
    return [PermissionRead.model_validate(r) for r in rows]


@router.post(
    "",
    response_model=PermissionRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permissions("role:assign_permission"))],
)
async def create_permission(
    data: PermissionCreate, db: AsyncSession = Depends(get_db)
) -> PermissionRead:
    perm = Permission(code=data.code, description=data.description)
    db.add(perm)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Permission code already exists")
    await db.refresh(perm)
    return PermissionRead.model_validate(perm)


@router.patch(
    "/{permission_id}",
    response_model=PermissionRead,
    dependencies=[Depends(require_permissions("role:assign_permission"))],
)
async def update_permission(
    permission_id: int,
    data: PermissionUpdate,
    db: AsyncSession = Depends(get_db),
) -> PermissionRead:
    perm = await db.get(Permission, permission_id)
    if perm is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Permission not found")
    if data.description is not None:
        perm.description = data.description
    await db.commit()
    await db.refresh(perm)
    return PermissionRead.model_validate(perm)


@router.delete(
    "/{permission_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permissions("role:assign_permission"))],
)
async def delete_permission(
    permission_id: int, db: AsyncSession = Depends(get_db)
) -> None:
    perm = await db.get(Permission, permission_id)
    if perm is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Permission not found")
    await db.delete(perm)
    await db.commit()
