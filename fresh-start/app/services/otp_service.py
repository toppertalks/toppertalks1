"""Email OTP service — generate, store (hashed) and verify 6-digit codes via Redis."""
from __future__ import annotations

import hashlib
import hmac
import secrets

from app.core.config import settings
from app.core.redis_client import get_redis

OTP_PREFIX = "auth:otp:verify:"
OTP_ATTEMPTS_PREFIX = "auth:otp:attempts:"
OTP_COOLDOWN_PREFIX = "auth:otp:cooldown:"

OTP_LENGTH = 6
OTP_EXPIRE_SECONDS = 10 * 60  # 10 minutes
OTP_MAX_ATTEMPTS = 5
OTP_RESEND_COOLDOWN = 60  # seconds between requests for the same email


def _hash_otp(otp: str, email: str) -> str:
    # Bind hash to email so a leaked Redis row can't be replayed against another user.
    key = f"{settings.SECRET_KEY}:{email.lower()}"
    return hmac.new(key.encode(), otp.encode(), hashlib.sha256).hexdigest()


def _generate_otp() -> str:
    # secrets.randbelow gives a uniform unbiased 0..10^6-1
    return f"{secrets.randbelow(10 ** OTP_LENGTH):0{OTP_LENGTH}d}"


class OTPCooldownError(Exception):
    """Raised when caller asked for a new OTP too soon. .retry_after holds seconds."""

    def __init__(self, retry_after: int) -> None:
        self.retry_after = retry_after
        super().__init__(f"Retry after {retry_after}s")


async def issue_otp(email: str) -> str:
    """Generate a fresh OTP for `email`, store its hash in Redis, and return the
    plaintext code so the caller can email it.

    Raises OTPCooldownError if the previous OTP was issued less than
    OTP_RESEND_COOLDOWN seconds ago.
    """
    email = email.lower()
    redis = get_redis()
    cooldown_key = f"{OTP_COOLDOWN_PREFIX}{email}"
    ttl = await redis.ttl(cooldown_key)
    if ttl and ttl > 0:
        raise OTPCooldownError(retry_after=ttl)

    otp = _generate_otp()
    await redis.setex(f"{OTP_PREFIX}{email}", OTP_EXPIRE_SECONDS, _hash_otp(otp, email))
    await redis.delete(f"{OTP_ATTEMPTS_PREFIX}{email}")
    await redis.setex(cooldown_key, OTP_RESEND_COOLDOWN, "1")
    return otp


async def verify_otp(email: str, otp: str) -> bool:
    """Constant-time compare against stored hash; deletes the entry on success.
    Returns False on mismatch, missing, expired, or attempt-limit exceeded.
    """
    email = email.lower()
    redis = get_redis()
    stored = await redis.get(f"{OTP_PREFIX}{email}")
    if not stored:
        return False

    attempts = await redis.incr(f"{OTP_ATTEMPTS_PREFIX}{email}")
    # Set TTL on first increment so it auto-cleans even on no successful verify.
    if attempts == 1:
        await redis.expire(f"{OTP_ATTEMPTS_PREFIX}{email}", OTP_EXPIRE_SECONDS)
    if attempts > OTP_MAX_ATTEMPTS:
        # Burn the OTP so the caller has to request a new one.
        await redis.delete(f"{OTP_PREFIX}{email}")
        return False

    candidate = _hash_otp(otp, email)
    if not hmac.compare_digest(stored, candidate):
        return False

    # Success — invalidate so an OTP is single-use.
    await redis.delete(f"{OTP_PREFIX}{email}")
    await redis.delete(f"{OTP_ATTEMPTS_PREFIX}{email}")
    return True
