"""
Redis cache module — Cache-Aside pattern for TopperTalks.

Architecture
------------
A single ConnectionPool is created once at startup (via init_redis) and
shared by all requests. This is identical in principle to PgBouncer for
Postgres: instead of opening a new TCP connection per request, every
coroutine borrows a slot from the pool and returns it immediately.

Usage in routes
---------------
    from cache import cache_get, cache_set, cache_delete

    # Read-through
    data = await cache_get("topper:profile:abc123")
    if data is None:
        data = ... # fetch from DB
        await cache_set("topper:profile:abc123", data, ttl=300)

    # Invalidation after a write
    await cache_delete("topper:profile:abc123")

Failure model
-------------
Every function silently swallows Redis errors and returns None / no-ops.
A Redis outage degrades performance (every request hits the DB) but never
takes the API down.

Cache keys used in this project
--------------------------------
  toppers:list:{exam or "all"}:{limit}    TTL 30 s   — online status changes
  topper:profile:{uid}                    TTL 300 s  — invalidated on status PATCH
  ratings:{topper_uid}:{limit}            TTL 300 s  — invalidated on new rating
"""

import json
import logging
from typing import Any, Optional

import redis.asyncio as aioredis

from config import REDIS_URL

_logger = logging.getLogger("toppertalks")

# ---------------------------------------------------------------------------
# Module-level state — initialised in lifespan, never in a request path.
# ---------------------------------------------------------------------------
_pool: Optional[aioredis.ConnectionPool] = None
redis_client: Optional[aioredis.Redis] = None


async def init_redis() -> None:
    """Create the connection pool. Call once in the FastAPI lifespan startup."""
    global _pool, redis_client
    try:
        _pool = aioredis.ConnectionPool.from_url(
            REDIS_URL,
            # Keep up to 20 idle connections ready in the pool.
            # Each FastAPI worker process gets its own pool of this size.
            max_connections=20,
            decode_responses=True,
        )
        redis_client = aioredis.Redis(connection_pool=_pool)
        await redis_client.ping()  # verify connection is actually reachable
        _logger.info('"Redis initialised — connection pool ready (max_connections=20, url=%s)"', REDIS_URL)
    except Exception as exc:
        _logger.warning("Redis unavailable — caching disabled: %s", exc)
        redis_client = None
        _pool = None


async def close_redis() -> None:
    """Drain the pool. Call once in the FastAPI lifespan shutdown."""
    global _pool, redis_client
    if redis_client:
        await redis_client.aclose()
    if _pool:
        await _pool.aclose()
    redis_client = None
    _pool = None
    _logger.info('"Redis connection pool closed"')


# ---------------------------------------------------------------------------
# Public helpers
# ---------------------------------------------------------------------------

async def cache_get(key: str) -> Optional[Any]:
    """Return the deserialized value, or None on miss / error."""
    if redis_client is None:
        return None
    try:
        raw = await redis_client.get(key)
        return json.loads(raw) if raw is not None else None
    except Exception:
        return None


async def cache_set(key: str, value: Any, ttl: int) -> None:
    """Serialize value as JSON and store with the given TTL (seconds)."""
    if redis_client is None:
        return
    try:
        await redis_client.set(key, json.dumps(value, default=str), ex=ttl)
    except Exception:
        pass


async def cache_delete(key: str) -> None:
    """Delete a single key. Silently ignores errors."""
    if redis_client is None:
        return
    try:
        await redis_client.delete(key)
    except Exception:
        pass


async def cache_delete_pattern(pattern: str) -> None:
    """Delete all keys matching a glob pattern.

    Uses SCAN (non-blocking, cursor-based) instead of KEYS (blocks the Redis
    event loop for the duration). Safe in production.
    """
    if redis_client is None:
        return
    try:
        async for key in redis_client.scan_iter(match=pattern, count=100):
            await redis_client.delete(key)
    except Exception:
        pass
