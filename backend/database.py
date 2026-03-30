import os

from sqlalchemy import MetaData
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from config import DATABASE_URL, DATABASE_URL_READER

# ---------------------------------------------------------------------------
# Constraint Naming Convention
#
# PostgreSQL auto-generates names for indexes, foreign keys, unique constraints
# etc. Without a convention, the name is non-deterministic across environments
# (e.g. user_pkey_a12bc on local, user_pkey_z98xy on prod). When Alembic tries
# to DROP or ALTER that constraint in a migration it looks up the name — if the
# names don't match, the migration fails in production but passes locally.
#
# This convention makes every name predictable and identical everywhere:
#   ix_users_email          ← index on users.email
#   uq_users_email          ← unique constraint on users.email
#   fk_toppers_uid_users    ← foreign key from toppers.uid → users
#   pk_users                ← primary key on users
# ---------------------------------------------------------------------------
POSTGRES_NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=POSTGRES_NAMING_CONVENTION)


# ---------------------------------------------------------------------------
# Shared engine settings — PgBouncer transaction pooling mode
# ---------------------------------------------------------------------------
_ENGINE_KWARGS = dict(
    pool_size=10,
    max_overflow=5,
    pool_pre_ping=True,
    pool_recycle=1800,
    pool_timeout=30,
    echo=os.getenv("SQL_ECHO", "false").lower() == "true",
    connect_args={"prepared_statement_cache_size": 0},
)

# ── Primary (Read-Write) ─────────────────────────────────────────────────────
# All INSERT / UPDATE / DELETE go here.
# Also used for "self-owned" reads (profile, wallet, sessions) to avoid
# serving stale data due to async replication lag.
writer_engine = create_async_engine(DATABASE_URL, **_ENGINE_KWARGS)
AsyncWriterSession = async_sessionmaker(
    writer_engine, class_=AsyncSession, expire_on_commit=False
)

# ── Read Replica (Read-Only) ─────────────────────────────────────────────────
# SELECT-only routes for global / public data hit this engine.
# If DATABASE_URL_READER is not set in .env, reader_engine reuses writer_engine
# so the app works correctly on a single-node setup without any code changes.
if DATABASE_URL_READER == DATABASE_URL:
    reader_engine = writer_engine
    AsyncReaderSession = AsyncWriterSession
else:
    reader_engine = create_async_engine(DATABASE_URL_READER, **_ENGINE_KWARGS)
    AsyncReaderSession = async_sessionmaker(
        reader_engine, class_=AsyncSession, expire_on_commit=False
    )


# ── FastAPI Dependencies ──────────────────────────────────────────────────────

async def get_write_db() -> AsyncSession:
    """Routes that write (INSERT / UPDATE / DELETE) or read self-owned data.

    Commits on clean exit, rolls back on any exception.
    """
    async with AsyncWriterSession() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


# Backward-compatible alias — all existing routes using Depends(get_db) keep
# working without any change.
get_db = get_write_db


async def get_read_db() -> AsyncSession:
    """Routes that only SELECT global / public data (topper list, ratings).

    Hits the Read Replica when DATABASE_URL_READER is configured; falls back
    to the Primary otherwise. Never commits — this is a read-only session.
    """
    async with AsyncReaderSession() as session:
        yield session


# ── Startup ───────────────────────────────────────────────────────────────────

async def create_tables() -> None:
    import logging
    import orm_models  # noqa: F401  — populates Base.metadata

    _logger = logging.getLogger("toppertalks")
    _replica = DATABASE_URL_READER != DATABASE_URL
    _logger.info(
        '"Database initialising — writer: %s | read_replica: %s"',
        DATABASE_URL.split("@")[-1],
        "enabled" if _replica else "disabled (single node)",
    )
    async with writer_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    _logger.info('"Database initialised — all tables verified/created"')

