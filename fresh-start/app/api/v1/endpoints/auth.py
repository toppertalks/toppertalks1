from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from fastapi.security import HTTPAuthorizationCredentials

from app.api.deps import (
    bearer_scheme,
    client_ip,
    client_user_agent,
    get_current_active_user,
)
from app.core.config import settings
from app.core.rate_limit import limiter
from app.core.redis_client import blacklist_token
from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    GoogleAuthCallback,
    GoogleAuthUrlResponse,
    LoginRequest,
    LogoutRequest,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    SendVerificationOtpRequest,
    TokenResponse,
    UserPublic,
    VerifyEmailOtpRequest,
    VerifyEmailRequest,
)
from app.services.audit_service import AuditService
from app.services.auth_service import AccountLockedError, AuthError, AuthService
from app.services.email_service import (
    send_password_reset_email,
    send_verification_email,
)
from app.services.oauth_google import OAuthError, build_authorize_url, exchange_code
from app.services.otp_service import OTPCooldownError, issue_otp, verify_otp
from app.services.token_service import TokenService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=UserPublic,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("10/minute")
async def register(
    request: Request,
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> UserPublic:
    auth = AuthService(db)
    audit = AuditService(db)
    try:
        user = await auth.register(data)
    except AuthError as exc:
        await audit.log(
            event="REGISTER_FAILED",
            status="failure",
            ip_address=client_ip(request),
            user_agent=client_user_agent(request),
            meta={"email": data.email, "reason": str(exc)},
        )
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(exc))

    await audit.log(
        event="REGISTER_SUCCESS",
        user_id=user.id,
        ip_address=client_ip(request),
        user_agent=client_user_agent(request),
    )

    # Fire-and-forget verification email — includes both a magic link (JWT) and
    # a 6-digit OTP so the user can verify with whichever is more convenient.
    try:
        token = await auth.create_email_verification_token(user)
        link = f"{settings.FRONTEND_URL}/verify-email?token={token}&email={user.email}"
        try:
            otp = await issue_otp(user.email)
        except OTPCooldownError:
            otp = None
        send_verification_email(to=user.email, link=link, otp=otp)
    except Exception:
        pass

    return UserPublic.model_validate(
        {
            **user.__dict__,
            "role_names": user.role_names,
            "permission_codes": user.permission_codes,
        }
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit(settings.LOGIN_RATE_LIMIT)
async def login(
    request: Request,
    data: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    auth = AuthService(db)
    tokens = TokenService(db)
    audit = AuditService(db)

    try:
        user = await auth.authenticate(data.email, data.password, data.mfa_code)
    except AccountLockedError as exc:
        await audit.log(
            event="ACCOUNT_LOCKED",
            status="failure",
            ip_address=client_ip(request),
            user_agent=client_user_agent(request),
            meta={"email": data.email},
        )
        raise HTTPException(status.HTTP_423_LOCKED, detail=str(exc))
    except AuthError as exc:
        await audit.log(
            event="LOGIN_FAILED",
            status="failure",
            ip_address=client_ip(request),
            user_agent=client_user_agent(request),
            meta={"email": data.email, "reason": str(exc)},
        )
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail=str(exc))

    access, refresh, expires_in = await tokens.issue_token_pair(
        user,
        user_agent=client_user_agent(request),
        ip_address=client_ip(request),
    )

    await audit.log(
        event="LOGIN_SUCCESS",
        user_id=user.id,
        ip_address=client_ip(request),
        user_agent=client_user_agent(request),
    )

    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        expires_in=expires_in,
    )


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("30/minute")
async def refresh_tokens(
    request: Request,
    data: RefreshRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    tokens = TokenService(db)
    audit = AuditService(db)
    try:
        user, access, refresh, expires_in = await tokens.rotate_refresh_token(
            data.refresh_token,
            user_agent=client_user_agent(request),
            ip_address=client_ip(request),
        )
    except ValueError as exc:
        await audit.log(
            event="TOKEN_REFRESH_FAILED",
            status="failure",
            ip_address=client_ip(request),
            user_agent=client_user_agent(request),
            meta={"reason": str(exc)},
        )
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail=str(exc))

    await audit.log(
        event="TOKEN_REFRESH",
        user_id=user.id,
        ip_address=client_ip(request),
        user_agent=client_user_agent(request),
    )
    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        expires_in=expires_in,
    )


@router.post("/logout", response_model=MessageResponse)
async def logout(
    request: Request,
    data: LogoutRequest,
    db: AsyncSession = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    user: User = Depends(get_current_active_user),
) -> MessageResponse:
    tokens = TokenService(db)
    audit = AuditService(db)

    # Revoke refresh token if provided
    if data.refresh_token:
        await tokens.revoke_refresh_token(data.refresh_token)

    # Blacklist the current access token until its natural expiry
    try:
        payload = decode_token(credentials.credentials, expected_type="access")
        jti = payload.get("jti")
        exp = payload.get("exp")
        if jti and exp:
            now = int(datetime.now(tz=timezone.utc).timestamp())
            ttl = max(int(exp) - now, 0)
            await blacklist_token(jti, ttl)
    except JWTError:
        pass

    await audit.log(
        event="LOGOUT",
        user_id=user.id,
        ip_address=client_ip(request),
        user_agent=client_user_agent(request),
    )
    return MessageResponse(message="Logged out")


@router.post("/logout-all", response_model=MessageResponse)
async def logout_all(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
) -> MessageResponse:
    tokens = TokenService(db)
    audit = AuditService(db)
    revoked = await tokens.revoke_all_for_user(user.id)
    await audit.log(
        event="LOGOUT_ALL",
        user_id=user.id,
        ip_address=client_ip(request),
        user_agent=client_user_agent(request),
        meta={"revoked_refresh_tokens": revoked},
    )
    return MessageResponse(message=f"Revoked {revoked} refresh tokens")


@router.get("/me", response_model=UserPublic)
async def me(user: User = Depends(get_current_active_user)) -> UserPublic:
    return UserPublic.model_validate(
        {
            **user.__dict__,
            "role_names": user.role_names,
            "permission_codes": user.permission_codes,
        }
    )


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    request: Request,
    data: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
) -> MessageResponse:
    auth = AuthService(db)
    tokens = TokenService(db)
    audit = AuditService(db)
    try:
        await auth.change_password(user, data.current_password, data.new_password)
    except AuthError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(exc))

    # Force re-login everywhere on password change.
    await tokens.revoke_all_for_user(user.id)
    await audit.log(
        event="PASSWORD_CHANGE",
        user_id=user.id,
        ip_address=client_ip(request),
        user_agent=client_user_agent(request),
    )
    return MessageResponse(message="Password updated; please log in again.")


# ---- Email verification ---------------------------------------------------

@router.post("/request-verification", response_model=MessageResponse)
@limiter.limit("5/minute")
async def request_verification(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
) -> MessageResponse:
    if user.is_verified:
        return MessageResponse(message="Email already verified")
    auth = AuthService(db)
    token = await auth.create_email_verification_token(user)
    link = f"{settings.FRONTEND_URL}/verify-email?token={token}&email={user.email}"
    try:
        otp = await issue_otp(user.email)
    except OTPCooldownError:
        otp = None
    send_verification_email(to=user.email, link=link, otp=otp)
    return MessageResponse(message="Verification email sent")


@router.post("/send-verification-otp", response_model=MessageResponse)
@limiter.limit("5/minute")
async def send_verification_otp(
    request: Request,
    data: SendVerificationOtpRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Public endpoint to (re)send a verification OTP+link.

    We always respond with the same message regardless of whether the email
    exists, to avoid user enumeration.
    """
    auth = AuthService(db)
    user = await auth.find_user_by_email(data.email)
    generic = MessageResponse(message="If that email is registered, a code has been sent.")
    if user is None or user.is_verified:
        return generic

    try:
        otp = await issue_otp(user.email)
    except OTPCooldownError as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Please wait {exc.retry_after}s before requesting another code.",
        )

    token = await auth.create_email_verification_token(user)
    link = f"{settings.FRONTEND_URL}/verify-email?token={token}&email={user.email}"
    send_verification_email(to=user.email, link=link, otp=otp)
    return generic


@router.post("/verify-email-otp", response_model=MessageResponse)
@limiter.limit("20/minute")
async def verify_email_otp(
    request: Request,
    data: VerifyEmailOtpRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    if not await verify_otp(data.email, data.otp):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired code",
        )
    auth = AuthService(db)
    audit = AuditService(db)
    try:
        user = await auth.mark_email_verified(data.email)
    except AuthError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(exc))
    await audit.log(
        event="EMAIL_VERIFIED",
        user_id=user.id,
        ip_address=client_ip(request),
        user_agent=client_user_agent(request),
        meta={"method": "otp"},
    )
    return MessageResponse(message="Email verified")


@router.post("/verify-email", response_model=MessageResponse)
@limiter.limit("20/minute")
async def verify_email(
    request: Request,
    data: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    auth = AuthService(db)
    audit = AuditService(db)
    try:
        user = await auth.verify_email(data.token)
    except AuthError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(exc))

    await audit.log(
        event="EMAIL_VERIFIED",
        user_id=user.id,
        ip_address=client_ip(request),
        user_agent=client_user_agent(request),
        meta={"method": "link"},
    )
    return MessageResponse(message="Email verified")


# ---- Password reset -------------------------------------------------------

@router.post("/forgot-password", response_model=MessageResponse)
@limiter.limit("5/minute")
async def forgot_password(
    request: Request,
    data: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    auth = AuthService(db)
    user = await auth.find_user_by_email(data.email)
    if user and user.is_active:
        token = await auth.create_password_reset_token(user)
        link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        send_password_reset_email(to=user.email, link=link)
        await AuditService(db).log(
            event="PASSWORD_RESET_REQUESTED",
            user_id=user.id,
            ip_address=client_ip(request),
            user_agent=client_user_agent(request),
        )
    # Always 200 -> no user enumeration
    return MessageResponse(message="If that email exists, a reset link was sent")


@router.post("/reset-password", response_model=MessageResponse)
@limiter.limit("10/minute")
async def reset_password(
    request: Request,
    data: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    auth = AuthService(db)
    tokens = TokenService(db)
    try:
        user = await auth.reset_password(data.token, data.new_password)
    except AuthError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(exc))

    await tokens.revoke_all_for_user(user.id)
    await AuditService(db).log(
        event="PASSWORD_RESET",
        user_id=user.id,
        ip_address=client_ip(request),
        user_agent=client_user_agent(request),
    )
    return MessageResponse(message="Password reset; please log in")


# ---- Google OAuth ---------------------------------------------------------

@router.get("/google/url", response_model=GoogleAuthUrlResponse)
async def google_url() -> GoogleAuthUrlResponse:
    try:
        url, state = await build_authorize_url()
    except OAuthError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return GoogleAuthUrlResponse(authorize_url=url, state=state)


@router.post("/google/callback", response_model=TokenResponse)
@limiter.limit("20/minute")
async def google_callback(
    request: Request,
    data: GoogleAuthCallback,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    try:
        profile = await exchange_code(data.code, data.state)
    except OAuthError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(exc))

    email = profile.get("email")
    if not email:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Google did not return an email")

    auth = AuthService(db)
    audit = AuditService(db)

    try:
        user = await auth.find_or_create_oauth_user(
            email=email,
            full_name=profile.get("name"),
            email_verified=bool(profile.get("email_verified", True)),
        )
    except AuthError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(exc))

    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account disabled")

    user.last_login_at = datetime.now(tz=timezone.utc)
    await db.commit()
    await db.refresh(user)

    access, refresh, expires_in = await TokenService(db).issue_token_pair(
        user,
        user_agent=client_user_agent(request),
        ip_address=client_ip(request),
    )
    await audit.log(
        event="LOGIN_SUCCESS",
        user_id=user.id,
        ip_address=client_ip(request),
        user_agent=client_user_agent(request),
        meta={"provider": "google"},
    )
    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        expires_in=expires_in,
    )
