from __future__ import annotations

from typing import Optional

import redis.asyncio as redis

from app.core.config import settings

_redis: Optional[redis.Redis] = None


def get_redis() -> redis.Redis:
    """Module-level singleton async Redis client."""
    global _redis
    if _redis is None:
        _redis = redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            max_connections=50,
        )
    return _redis


async def close_redis() -> None:
    global _redis
    if _redis is not None:
        await _redis.close()
        _redis = None


# ---- Token blacklist helpers ---------------------------------------------

BLACKLIST_PREFIX = "auth:blacklist:"
REFRESH_PREFIX = "auth:refresh:"


async def blacklist_token(jti: str, ttl_seconds: int) -> None:
    """Add an access-token JTI to the blacklist with TTL = token remaining life."""
    if ttl_seconds <= 0:
        return
    await get_redis().setex(f"{BLACKLIST_PREFIX}{jti}", ttl_seconds, "1")


async def is_token_blacklisted(jti: str) -> bool:
    return await get_redis().exists(f"{BLACKLIST_PREFIX}{jti}") == 1
