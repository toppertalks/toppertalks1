from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.models.associations import user_roles

if TYPE_CHECKING:
    from app.models.refresh_token import RefreshToken
    from app.models.role import Role
    from app.models.topper import Topper


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str | None] = mapped_column(String(64), unique=True, index=True, nullable=True)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # MFA
    mfa_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    mfa_secret: Mapped[str | None] = mapped_column(String(64), nullable=True)

    # Brute-force protection
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    locked_until: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ---- Domain profile fields (TopperTalks) ----------------------------
    role: Mapped[str] = mapped_column(String(32), default="student", nullable=False)
    exam_mode: Mapped[str] = mapped_column(String(16), default="JEE", nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

    topper_profile: Mapped["Topper | None"] = relationship(
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    roles: Mapped[List["Role"]] = relationship(
        secondary=user_roles,
        back_populates="users",
        lazy="selectin",
    )
    refresh_tokens: Mapped[List["RefreshToken"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    # ---- Convenience helpers --------------------------------------------

    @property
    def role_names(self) -> List[str]:
        return [r.name for r in self.roles]

    @property
    def permission_codes(self) -> List[str]:
        codes: set[str] = set()
        for r in self.roles:
            for p in r.permissions:
                codes.add(p.code)
        return sorted(codes)

    def is_locked(self) -> bool:
        if self.locked_until is None:
            return False
        return self.locked_until > datetime.utcnow().astimezone(self.locked_until.tzinfo)

    def __repr__(self) -> str:
        return f"<User {self.email}>"
