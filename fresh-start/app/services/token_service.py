from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional, Tuple

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    generate_refresh_token,
    hash_refresh_token,
    refresh_token_expiry,
)
from app.models.refresh_token import RefreshToken
from app.models.user import User


class TokenService:
    """
    Handles access + refresh token issuance, rotation, and revocation.

    Refresh-token rotation:
      - On use, mark old token revoked, store new token id as `replaced_by_id`.
      - If a revoked token is reused, revoke the whole user's token family
        (theft detection).
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ---- Issuance --------------------------------------------------------

    async def issue_token_pair(
        self,
        user: User,
        *,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> Tuple[str, str, int]:
        """Returns (access_token, refresh_token, access_expires_in_seconds)."""
        access_token, _jti, access_exp = create_access_token(
            subject=str(user.id),
            roles=user.role_names,
            permissions=user.permission_codes,
        )

        raw_refresh = generate_refresh_token()
        record = RefreshToken(
            user_id=user.id,
            token_hash=hash_refresh_token(raw_refresh),
            expires_at=refresh_token_expiry(),
            user_agent=user_agent,
            ip_address=ip_address,
        )
        self.db.add(record)
        await self.db.commit()
        await self.db.refresh(record)

        expires_in = int((access_exp - datetime.now(tz=timezone.utc)).total_seconds())
        return access_token, raw_refresh, max(expires_in, 0)

    # ---- Rotation --------------------------------------------------------

    async def rotate_refresh_token(
        self,
        raw_refresh: str,
        *,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> Tuple[User, str, str, int]:
        """
        Validate a presented refresh token, rotate it, and return a new pair.
        Raises ValueError on any invalid / reused / expired token.
        """
        token_hash = hash_refresh_token(raw_refresh)
        result = await self.db.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        record: Optional[RefreshToken] = result.scalar_one_or_none()
        if record is None:
            raise ValueError("Invalid refresh token")

        # Theft detection: a previously revoked token is being reused.
        if record.revoked:
            await self._revoke_all_for_user(record.user_id, reason="reuse_detected")
            await self.db.commit()
            raise ValueError("Refresh token reuse detected; all sessions revoked")

        if not record.is_active():
            raise ValueError("Refresh token expired")

        # Load user with roles/permissions
        user = await self.db.get(User, record.user_id)
        if user is None or not user.is_active:
            raise ValueError("User inactive")

        # Issue new pair
        access_token, _jti, access_exp = create_access_token(
            subject=str(user.id),
            roles=user.role_names,
            permissions=user.permission_codes,
        )
        new_raw_refresh = generate_refresh_token()
        new_record = RefreshToken(
            user_id=user.id,
            token_hash=hash_refresh_token(new_raw_refresh),
            expires_at=refresh_token_expiry(),
            user_agent=user_agent,
            ip_address=ip_address,
        )
        self.db.add(new_record)
        await self.db.flush()

        # Mark old as revoked + linked to new
        record.revoked = True
        record.revoked_at = datetime.now(tz=timezone.utc)
        record.replaced_by_id = new_record.id

        await self.db.commit()

        expires_in = int((access_exp - datetime.now(tz=timezone.utc)).total_seconds())
        return user, access_token, new_raw_refresh, max(expires_in, 0)

    # ---- Revocation ------------------------------------------------------

    async def revoke_refresh_token(self, raw_refresh: str) -> bool:
        token_hash = hash_refresh_token(raw_refresh)
        result = await self.db.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        record = result.scalar_one_or_none()
        if record is None or record.revoked:
            return False
        record.revoked = True
        record.revoked_at = datetime.now(tz=timezone.utc)
        await self.db.commit()
        return True

    async def revoke_all_for_user(self, user_id: uuid.UUID) -> int:
        count = await self._revoke_all_for_user(user_id, reason="manual")
        await self.db.commit()
        return count

    async def _revoke_all_for_user(
        self, user_id: uuid.UUID, *, reason: str = "manual"
    ) -> int:
        result = await self.db.execute(
            select(RefreshToken).where(
                RefreshToken.user_id == user_id, RefreshToken.revoked.is_(False)
            )
        )
        records = result.scalars().all()
        now = datetime.now(tz=timezone.utc)
        for r in records:
            r.revoked = True
            r.revoked_at = now
        return len(records)
