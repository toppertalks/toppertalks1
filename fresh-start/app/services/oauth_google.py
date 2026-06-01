from __future__ import annotations

import logging
import secrets as _secrets
from typing import Optional, Tuple
from urllib.parse import urlencode

import httpx

from app.core.config import settings
from app.core.redis_client import get_redis

logger = logging.getLogger(__name__)

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"

STATE_PREFIX = "oauth:google:state:"
STATE_TTL_SECONDS = 10 * 60


class OAuthError(Exception):
    pass


def _ensure_configured() -> None:
    if not (settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET):
        raise OAuthError("Google OAuth is not configured on the server")


async def build_authorize_url() -> Tuple[str, str]:
    _ensure_configured()
    state = _secrets.token_urlsafe(24)
    await get_redis().setex(f"{STATE_PREFIX}{state}", STATE_TTL_SECONDS, "1")

    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "include_granted_scopes": "true",
        "prompt": "select_account",
        "state": state,
    }
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}", state


async def _consume_state(state: str) -> bool:
    key = f"{STATE_PREFIX}{state}"
    redis = get_redis()
    val = await redis.get(key)
    if not val:
        return False
    await redis.delete(key)
    return True


async def exchange_code(code: str, state: Optional[str]) -> dict:
    _ensure_configured()
    if not state or not await _consume_state(state):
        raise OAuthError("Invalid or expired OAuth state")

    data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }
    async with httpx.AsyncClient(timeout=15) as client:
        token_resp = await client.post(GOOGLE_TOKEN_URL, data=data)
        if token_resp.status_code != 200:
            logger.warning("Google token exchange failed: %s", token_resp.text)
            raise OAuthError("Google token exchange failed")
        tokens = token_resp.json()

        access_token = tokens.get("access_token")
        if not access_token:
            raise OAuthError("Google did not return an access token")

        ui_resp = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if ui_resp.status_code != 200:
            raise OAuthError("Failed to fetch Google profile")
        return ui_resp.json()
