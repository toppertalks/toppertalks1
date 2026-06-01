from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ---- Permission ----------------------------------------------------------

class PermissionBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=255)


class PermissionCreate(PermissionBase):
    pass


class PermissionUpdate(BaseModel):
    description: Optional[str] = Field(None, max_length=255)


class PermissionRead(PermissionBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ---- Role ----------------------------------------------------------------

class RoleBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    description: Optional[str] = Field(None, max_length=255)


class RoleCreate(RoleBase):
    permission_ids: List[int] = []


class RoleUpdate(BaseModel):
    description: Optional[str] = Field(None, max_length=255)


class RoleRead(RoleBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    permissions: List[PermissionRead] = []


class RolePermissionsUpdate(BaseModel):
    permission_ids: List[int]


# ---- User (admin view) ---------------------------------------------------

class UserAdminCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: Optional[str] = Field(None, max_length=255)
    username: Optional[str] = Field(None, min_length=3, max_length=64)
    is_active: bool = True
    is_verified: bool = False
    is_superuser: bool = False
    role_ids: List[int] = []


class UserAdminUpdate(BaseModel):
    full_name: Optional[str] = Field(None, max_length=255)
    username: Optional[str] = Field(None, min_length=3, max_length=64)
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    is_superuser: Optional[bool] = None


class UserAdminRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    username: Optional[str] = None
    full_name: Optional[str] = None
    is_active: bool
    is_verified: bool
    is_superuser: bool
    mfa_enabled: bool
    last_login_at: Optional[datetime] = None
    created_at: datetime
    roles: List[RoleRead] = []


class UserRolesUpdate(BaseModel):
    role_ids: List[int]


class PaginatedUsers(BaseModel):
    total: int
    items: List[UserAdminRead]
