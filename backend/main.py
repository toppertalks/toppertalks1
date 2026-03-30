import logging
import sys
from pathlib import Path

# Ensure backend/ is on the import path when run from project root
sys.path.insert(0, str(Path(__file__).resolve().parent))

import uvicorn
import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from config import HOST, PORT, ALLOWED_ORIGINS, SENTRY_DSN, RATE_LIMIT_PER_MINUTE, REDIS_URL
import cache
from cache import init_redis, close_redis
from database import create_tables, writer_engine

from routes.toppers import router as toppers_router
from routes.sessions import router as sessions_router
from routes.wallet import router as wallet_router
from routes.ratings import router as ratings_router
from routes.user import router as user_router
from routes.mentor import router as mentor_router
from routes.events import router as events_router

# ---------------------------------------------------------------------------
# Structured logging — JSON format so Datadog / CloudWatch can parse fields.
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format='{"time":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","msg":%(message)s}',
)
logger = logging.getLogger("toppertalks")

# ---------------------------------------------------------------------------
# Sentry — real-time error tracking.
# Initialise before the app so it captures startup errors too.
# If SENTRY_DSN is empty, the SDK is a no-op (safe in local dev).
# ---------------------------------------------------------------------------
if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        # Capture 10% of transactions for performance tracing.
        # Increase to 1.0 temporarily when diagnosing slow routes.
        traces_sample_rate=0.1,
        # Strip PII from event payloads before sending to Sentry servers.
        send_default_pii=False,
    )
    logger.info('"Sentry initialised"')

# ---------------------------------------------------------------------------
# Rate limiter — backed by Redis so limits are shared across all worker
# processes (not per-process in-memory, which is ineffective under gunicorn).
# ---------------------------------------------------------------------------
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=REDIS_URL,
    default_limits=[f"{RATE_LIMIT_PER_MINUTE}/minute"],
)
logger.info('"Rate limiter configured — %s req/min per IP, backed by Redis"', RATE_LIMIT_PER_MINUTE)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info('"TopperTalks API starting — host=%s port=%s"', HOST, PORT)
    await init_redis()
    await create_tables()
    logger.info('"Application startup complete — all systems operational"')
    yield
    logger.info('"Shutting down TopperTalks API"')
    await close_redis()
    logger.info('"Application shutdown complete"')


app = FastAPI(
    title="TopperTalks API",
    version="1.0.0",
    lifespan=lifespan,
    # Disable OpenAPI docs in production by setting DOCS_URL env to empty string
    docs_url="/docs" if sys.argv[0] != "gunicorn" else None,
    redoc_url=None,
)

# Attach rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ---------------------------------------------------------------------------
# CORS — explicit origin whitelist. Never use ["*"] with credentials.
# ALLOWED_ORIGINS is built from env var in config.py.
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
)
logger.info('"CORS configured — %d allowed origin(s): %s"', len(ALLOWED_ORIGINS), ALLOWED_ORIGINS)

# Register routers
app.include_router(toppers_router)
app.include_router(sessions_router)
app.include_router(wallet_router)
app.include_router(ratings_router)
app.include_router(user_router)
app.include_router(mentor_router)
app.include_router(events_router)


@app.get("/")
async def root():
    return {"status": "ok", "service": "TopperTalks API"}


# ---------------------------------------------------------------------------
# Health check — checks Postgres and Redis reachability, not just process
# liveness. Load balancers (AWS ALB, nginx) poll this to decide whether to
# route traffic to this instance. Returns 200 only when all deps are up.
# ---------------------------------------------------------------------------
@app.get("/health", tags=["ops"])
async def health():
    checks: dict = {}

    # Postgres
    try:
        async with writer_engine.connect() as conn:
            from sqlalchemy import text
            await conn.execute(text("SELECT 1"))
        checks["postgres"] = "ok"
    except Exception as exc:
        checks["postgres"] = f"error: {exc}"

    # Redis
    try:
        if cache.redis_client is not None:
            await cache.redis_client.ping()
            checks["redis"] = "ok"
        else:
            checks["redis"] = "not configured"
    except Exception as exc:
        checks["redis"] = f"error: {exc}"

    all_ok = all(v == "ok" for v in checks.values())
    status_code = 200 if all_ok else 503
    if not all_ok:
        logger.warning('"Health check degraded — %s"', checks)
    return JSONResponse(status_code=status_code, content={"status": "healthy" if all_ok else "degraded", **checks})


if __name__ == "__main__":
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)

