from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

import pyotp
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_purpose_token,
    decode_purpose_token,
    hash_password,
    password_needs_rehash,
    verify_password,
)
from app.models.role import Role
from app.models.user import User
from app.schemas.auth import RegisterRequest


class AuthError(Exception):
    """Raised on any authentication failure (mapped to HTTP 401/403 by routes)."""


class AccountLockedError(AuthError):
    pass


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ---- Registration ----------------------------------------------------

    async def register(self, data: RegisterRequest) -> User:
        existing = await self.db.execute(
            select(User).where(User.email == data.email.lower())
        )
        if existing.scalar_one_or_none() is not None:
            raise AuthError("Email already registered")

        user = User(
            email=data.email.lower(),
            username=data.username,
            full_name=data.full_name,
            hashed_password=hash_password(data.password),
            is_active=True,
            is_verified=False,
        )

        # Assign default "USER" role if it exists
        default_role = await self.db.execute(select(Role).where(Role.name == "USER"))
        role = default_role.scalar_one_or_none()
        if role is not None:
            user.roles.append(role)

        self.db.add(user)
        try:
            await self.db.commit()
        except IntegrityError as exc:
            await self.db.rollback()
            raise AuthError("Email or username already in use") from exc

        await self.db.refresh(user)
        return user

    # ---- Authentication --------------------------------------------------

    async def authenticate(
        self,
        email: str,
        password: str,
        mfa_code: Optional[str] = None,
    ) -> User:
        result = await self.db.execute(
            select(User).where(User.email == email.lower())
        )
        user: Optional[User] = result.scalar_one_or_none()

        # Same error for unknown user vs bad password (no user enumeration)
        if user is None:
            raise AuthError("Invalid credentials")

        if not user.is_active:
            raise AuthError("Account is disabled")

        if user.is_locked():
            raise AccountLockedError("Account temporarily locked")

        if not verify_password(password, user.hashed_password):
            await self._handle_failed_login(user)
            raise AuthError("Invalid credentials")

        # MFA
        if user.mfa_enabled:
            if not mfa_code:
                raise AuthError("MFA code required")
            totp = pyotp.TOTP(user.mfa_secret or "")
            if not totp.verify(mfa_code, valid_window=1):
                await self._handle_failed_login(user)
                raise AuthError("Invalid MFA code")

        # Successful login
        user.failed_login_attempts = 0
        user.locked_until = None
        user.last_login_at = datetime.now(tz=timezone.utc)

        # Opportunistic password rehash if bcrypt rounds changed
        if password_needs_rehash(user.hashed_password):
            user.hashed_password = hash_password(password)

        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def _handle_failed_login(self, user: User) -> None:
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
        if user.failed_login_attempts >= settings.MAX_FAILED_LOGIN_ATTEMPTS:
            user.locked_until = datetime.now(tz=timezone.utc) + timedelta(
                minutes=settings.ACCOUNT_LOCK_MINUTES
            )
            user.failed_login_attempts = 0
        await self.db.commit()

    # ---- Password change -------------------------------------------------

    async def change_password(
        self, user: User, current_password: str, new_password: str
    ) -> None:
        if not verify_password(current_password, user.hashed_password):
            raise AuthError("Current password is incorrect")
        user.hashed_password = hash_password(new_password)
        await self.db.commit()

    # ---- Email verification ---------------------------------------------

    async def create_email_verification_token(self, user: User) -> str:
        return create_purpose_token(
            subject=str(user.id),
            purpose="verify",
            expires_in=timedelta(hours=settings.EMAIL_VERIFY_TOKEN_EXPIRE_HOURS),
        )

    async def verify_email(self, token: str) -> User:
        try:
            payload = decode_purpose_token(token, purpose="verify")
        except JWTError as exc:
            raise AuthError("Invalid or expired verification token") from exc

        try:
            user_id = uuid.UUID(payload["sub"])
        except (KeyError, ValueError) as exc:
            raise AuthError("Malformed token") from exc

        user = await self.db.get(User, user_id)
        if user is None:
            raise AuthError("User not found")
        if not user.is_verified:
            user.is_verified = True
            await self.db.commit()
            await self.db.refresh(user)
        return user

    async def mark_email_verified(self, email: str) -> User:
        """Flip is_verified for a user looked up by email. Used by OTP flow."""
        user = await self.find_user_by_email(email)
        if user is None:
            raise AuthError("User not found")
        if not user.is_verified:
            user.is_verified = True
            await self.db.commit()
            await self.db.refresh(user)
        return user

    # ---- Password reset --------------------------------------------------

    async def find_user_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(
            select(User).where(User.email == email.lower())
        )
        return result.scalar_one_or_none()

    async def create_password_reset_token(self, user: User) -> str:
        # `pwh` ties the token to the current password hash so the link is
        # automatically invalidated as soon as the password changes.
        return create_purpose_token(
            subject=str(user.id),
            purpose="reset",
            expires_in=timedelta(
                minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES
            ),
            extra={"pwh": user.hashed_password[-12:]},
        )

    async def reset_password(self, token: str, new_password: str) -> User:
        try:
            payload = decode_purpose_token(token, purpose="reset")
        except JWTError as exc:
            raise AuthError("Invalid or expired reset token") from exc

        try:
            user_id = uuid.UUID(payload["sub"])
        except (KeyError, ValueError) as exc:
            raise AuthError("Malformed token") from exc

        user = await self.db.get(User, user_id)
        if user is None or not user.is_active:
            raise AuthError("User not found")

        if payload.get("pwh") != user.hashed_password[-12:]:
            raise AuthError("Reset link is no longer valid")

        user.hashed_password = hash_password(new_password)
        user.failed_login_attempts = 0
        user.locked_until = None
        await self.db.commit()
        await self.db.refresh(user)
        return user

    # ---- OAuth (find-or-create) -----------------------------------------

    async def find_or_create_oauth_user(
        self,
        *,
        email: str,
        full_name: Optional[str] = None,
        email_verified: bool = True,
    ) -> User:
        email = email.lower()
        existing = await self.find_user_by_email(email)
        if existing is not None:
            updated = False
            if email_verified and not existing.is_verified:
                existing.is_verified = True
                updated = True
            if full_name and not existing.full_name:
                existing.full_name = full_name
                updated = True
            if updated:
                await self.db.commit()
                await self.db.refresh(existing)
            return existing

        # New OAuth user: no usable password (random hash so login won't work
        # without going through OAuth or password reset).
        import secrets

        user = User(
            email=email,
            full_name=full_name,
            hashed_password=hash_password(secrets.token_urlsafe(32)),
            is_active=True,
            is_verified=email_verified,
        )
        default_role = await self.db.execute(select(Role).where(Role.name == "USER"))
        role = default_role.scalar_one_or_none()
        if role is not None:
            user.roles.append(role)

        self.db.add(user)
        try:
            await self.db.commit()
        except IntegrityError as exc:
            await self.db.rollback()
            raise AuthError("Could not create user") from exc
        await self.db.refresh(user)
        return user
