"""
LiveKit access-token generation.

WebSocket is used ONLY for signaling (who-joined / call-accept / hang-up).
The actual audio + video stream is carried by LiveKit. To connect to a
LiveKit room the client needs a short-lived JWT issued and signed by
the server with the LiveKit API key + secret.
"""
from __future__ import annotations

from datetime import timedelta
from typing import Optional

from livekit.api import AccessToken, VideoGrants

from app.core.config import settings


def build_room_name(session_id: str) -> str:
    """Stable room name derived from our DB session id."""
    return f"tt_{session_id}"


def issue_livekit_token(
    *,
    session_id: str,
    user_id: str,
    user_name: str,
    can_publish: bool = True,
    ttl_minutes: int = 60,
) -> Optional[str]:
    """
    Return a signed LiveKit access token for the given user + room.
    Returns None if LiveKit credentials are not configured (dev mode).
    """
    api_key = settings.LIVEKIT_API_KEY
    api_secret = settings.LIVEKIT_API_SECRET
    if not api_key or not api_secret:
        return None

    grants = VideoGrants(
        room_join=True,
        room=build_room_name(session_id),
        can_publish=can_publish,
        can_subscribe=True,
        can_publish_data=True,
    )

    token = (
        AccessToken(api_key, api_secret)
        .with_identity(user_id)
        .with_name(user_name or user_id)
        .with_grants(grants)
        .with_ttl(timedelta(minutes=ttl_minutes))
    )
    return token.to_jwt()
