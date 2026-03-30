import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv

# Load .env from project root (one level up from backend/)
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "4000"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# CORS — comma-separated list of allowed origins.
# In production set: ALLOWED_ORIGINS=https://toppertalks.com,https://www.toppertalks.com
# Never use ["*"] with allow_credentials=True; browsers will block it.
ALLOWED_ORIGINS: List[str] = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", FRONTEND_URL).split(",")
    if o.strip()
]
# Always allow localhost during development — harmless in production.
if "http://localhost:3000" not in ALLOWED_ORIGINS:
    ALLOWED_ORIGINS.append("http://localhost:3000")

# PostgreSQL — set in .env as:
# DATABASE_URL=postgresql+asyncpg://user:password@pgbouncer-primary-host:6432/dbname
DATABASE_URL: str = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/toppertalks",
)

# Read Replica — point to PgBouncer in front of your replica node.
# If not set, all reads fall back to the Primary (DATABASE_URL).
DATABASE_URL_READER: str = os.getenv("DATABASE_URL_READER", "") or DATABASE_URL

# Redis — set in .env as:
# REDIS_URL=redis://:password@host:6379/0
REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Firebase project ID — needed to verify Firebase ID tokens issued by the frontend.
FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "")

# Sentry DSN — obtain from sentry.io → Project Settings → Client Keys.
# Leave empty to disable Sentry (e.g. local dev).
SENTRY_DSN: str = os.getenv("SENTRY_DSN", "")

# Rate limiting — max requests per minute per client IP on every route.
# Adjust per-route in routes if needed. 0 = unlimited (disables rate limiting).
RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "120"))

# Set SQL_ECHO=true in .env to log all SQL statements (development only)
# database.py reads this directly via os.getenv; it is listed here for documentation.
