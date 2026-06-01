from __future__ import annotations

import uuid
from typing import Iterable, Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.redis_client import is_token_blacklisted
from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User

bearer_scheme = HTTPBearer(auto_error=True)

_credentials_exc = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    token = credentials.credentials
    try:
        payload = decode_token(token, expected_type="access")
    except JWTError:
        raise _credentials_exc

    jti: Optional[str] = payload.get("jti")
    sub: Optional[str] = payload.get("sub")
    if not sub or not jti:
        raise _credentials_exc

    if await is_token_blacklisted(jti):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = uuid.UUID(sub)
    except ValueError:
        raise _credentials_exc

    user = await db.get(User, user_id)
    if user is None or not user.is_active:
        raise _credentials_exc
    return user


async def get_current_active_user(
    user: User = Depends(get_current_user),
) -> User:
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")
    return user


# ---- RBAC / permission guards -------------------------------------------

def require_roles(*allowed_roles: str):
    """Allow if the user has ANY of the listed roles (or is superuser)."""
    required = {r.upper() for r in allowed_roles}

    async def _checker(user: User = Depends(get_current_active_user)) -> User:
        if user.is_superuser:
            return user
        user_roles = {r.upper() for r in user.role_names}
        if not (required & user_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient role",
            )
        return user

    return _checker


def require_permissions(*required: str, mode: str = "all"):
    """
    Allow if user has required permissions.
      - mode="all": user must have ALL listed permissions.
      - mode="any": user must have AT LEAST ONE.
    Superusers always pass.
    """
    needed = set(required)

    async def _checker(user: User = Depends(get_current_active_user)) -> User:
        if user.is_superuser:
            return user
        have = set(user.permission_codes)
        ok = needed.issubset(have) if mode == "all" else bool(needed & have)
        if not ok:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user

    return _checker


# ---- Request helpers ----------------------------------------------------

def client_ip(request: Request) -> Optional[str]:
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else None


def client_user_agent(request: Request) -> Optional[str]:
    return request.headers.get("user-agent")
