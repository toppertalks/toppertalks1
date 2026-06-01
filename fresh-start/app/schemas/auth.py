from __future__ import annotations

import re
import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.core.config import settings


# ---- Password complexity ------------------------------------------------

_PASSWORD_RULES = (
    "Password must be at least 8 characters and contain an uppercase letter, "
    "a lowercase letter, a number, and a special character."
)


def _validate_password_strength(value: str) -> str:
    if len(value) < max(8, settings.PASSWORD_MIN_LENGTH):
        raise ValueError(_PASSWORD_RULES)
    if not re.search(r"[A-Z]", value):
        raise ValueError(_PASSWORD_RULES)
    if not re.search(r"[a-z]", value):
        raise ValueError(_PASSWORD_RULES)
    if not re.search(r"\d", value):
        raise ValueError(_PASSWORD_RULES)
    if not re.search(r"[^A-Za-z0-9]", value):
        raise ValueError(_PASSWORD_RULES)
    return value


# ---- Auth requests -------------------------------------------------------

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: Optional[str] = Field(None, max_length=255)
    username: Optional[str] = Field(None, min_length=3, max_length=64)

    @field_validator("password")
    @classmethod
    def _check_password(cls, v: str) -> str:
        return _validate_password_strength(v)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)
    mfa_code: Optional[str] = Field(None, min_length=6, max_length=6)


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def _check_password(cls, v: str) -> str:
        return _validate_password_strength(v)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def _check_password(cls, v: str) -> str:
        return _validate_password_strength(v)


class VerifyEmailRequest(BaseModel):
    token: str


class SendVerificationOtpRequest(BaseModel):
    email: EmailStr


class VerifyEmailOtpRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")


class GoogleAuthCallback(BaseModel):
    code: str
    state: Optional[str] = None


class GoogleAuthUrlResponse(BaseModel):
    authorize_url: str
    state: str


# ---- Auth responses ------------------------------------------------------

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class UserPublic(BaseModel):
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
    role_names: List[str] = []
    permission_codes: List[str] = []


class MessageResponse(BaseModel):
    message: str
