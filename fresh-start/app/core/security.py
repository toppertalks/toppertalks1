from __future__ import annotations

import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Literal, Optional, Tuple

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings

# ---- Passwords -----------------------------------------------------------

# bcrypt has a hard 72-byte limit on the password. We pre-hash with SHA-256
# (then base64-encode to keep it ASCII-safe) so arbitrarily long passwords
# work safely.
_BCRYPT_MAX_BYTES = 72


def _prepare(password: str) -> bytes:
    raw = password.encode("utf-8")
    if len(raw) <= _BCRYPT_MAX_BYTES:
        return raw
    import base64
    return base64.b64encode(hashlib.sha256(raw).digest())


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=settings.BCRYPT_ROUNDS)
    return bcrypt.hashpw(_prepare(password), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(_prepare(plain_password), hashed_password.encode("utf-8"))
    except Exception:
        return False


def password_needs_rehash(hashed_password: str) -> bool:
    """Return True if the stored hash uses fewer rounds than current policy."""
    try:
        # bcrypt hash format: $2b$<rounds>$<salt+digest>
        parts = hashed_password.split("$")
        if len(parts) < 4:
            return True
        rounds = int(parts[2])
        return rounds < settings.BCRYPT_ROUNDS
    except Exception:
        return True


# ---- JWT -----------------------------------------------------------------

TokenType = Literal["access", "refresh"]


def _now() -> datetime:
    return datetime.now(tz=timezone.utc)


def create_access_token(
    subject: str,
    *,
    roles: Optional[list[str]] = None,
    permissions: Optional[list[str]] = None,
    extra_claims: Optional[Dict[str, Any]] = None,
    expires_minutes: Optional[int] = None,
) -> Tuple[str, str, datetime]:
    """Returns (token, jti, expires_at)."""
    expire_in = expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES
    issued_at = _now()
    expires_at = issued_at + timedelta(minutes=expire_in)
    jti = uuid.uuid4().hex

    payload: Dict[str, Any] = {
        "sub": str(subject),
        "type": "access",
        "iat": int(issued_at.timestamp()),
        "exp": int(expires_at.timestamp()),
        "jti": jti,
        "roles": roles or [],
        "permissions": permissions or [],
    }
    if extra_claims:
        payload.update(extra_claims)

    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return token, jti, expires_at


def decode_token(token: str, *, expected_type: Optional[TokenType] = None) -> Dict[str, Any]:
    """Raises jose.JWTError on invalid/expired token."""
    payload = jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )
    if expected_type and payload.get("type") != expected_type:
        raise JWTError(f"Invalid token type, expected {expected_type}")
    return payload


# ---- Refresh tokens (opaque) --------------------------------------------

def generate_refresh_token() -> str:
    """Cryptographically strong random opaque token."""
    return secrets.token_urlsafe(64)


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def refresh_token_expiry() -> datetime:
    return _now() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)


# ---- Single-purpose signed tokens (email verify / password reset) -------

def create_purpose_token(
    *,
    subject: str,
    purpose: Literal["verify", "reset"],
    expires_in: timedelta,
    extra: Optional[Dict[str, Any]] = None,
) -> str:
    now = _now()
    payload: Dict[str, Any] = {
        "sub": str(subject),
        "type": purpose,
        "iat": int(now.timestamp()),
        "exp": int((now + expires_in).timestamp()),
        "jti": uuid.uuid4().hex,
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_purpose_token(
    token: str, *, purpose: Literal["verify", "reset"]
) -> Dict[str, Any]:
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    if payload.get("type") != purpose:
        raise JWTError("Invalid token type")
    return payload


__all__ = [
    "JWTError",
    "create_access_token",
    "create_purpose_token",
    "decode_purpose_token",
    "decode_token",
    "generate_refresh_token",
    "hash_password",
    "hash_refresh_token",
    "password_needs_rehash",
    "refresh_token_expiry",
    "verify_password",
]
