"""
Asynchronous Database Engine and Session Management with Resilient Fallback.
Supports AletCloud PostgreSQL 17 (via asyncpg / psycopg) with automatic local SQLite fallback.
"""

import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker,
    AsyncSession,
    AsyncEngine,
)

from backend.app.core.config import settings
from backend.app.db.base import Base

logger = logging.getLogger(__name__)


def get_async_database_url(url: str) -> str:
    """Ensures database URL uses an asynchronous driver."""
    clean_url = url.strip()
    if clean_url.startswith("postgresql://"):
        return clean_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if clean_url.startswith("sqlite:///"):
        return clean_url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
    return clean_url


import sys

def get_effective_database_url() -> str:
    """Returns isolated SQLite database URL during pytest runs, otherwise configured DATABASE_URL."""
    if "pytest" in sys.modules:
        return "sqlite+aiosqlite:///./test_lisan_health.db"
    return get_async_database_url(settings.DATABASE_URL)


# Determine primary and fallback database URLs
PRIMARY_DB_URL = get_effective_database_url()
SQLITE_FALLBACK_URL = "sqlite+aiosqlite:///./lisan_health.db"


def build_engine(db_url: str) -> AsyncEngine:
    """Builds an async SQLAlchemy engine with connection pooling."""
    is_sqlite = "sqlite" in db_url
    if is_sqlite:
        return create_async_engine(
            db_url,
            connect_args={"check_same_thread": False},
            echo=False,
        )
    return create_async_engine(
        db_url,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        connect_args={"timeout": 5},
        echo=False,
    )


# Active engine & sessionmaker
engine = build_engine(PRIMARY_DB_URL)
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)


async def init_db() -> None:
    """
    Initializes database tables and verifies connectivity.
    Falls back to SQLite if remote PostgreSQL is unreachable or unconfigured.
    """
    global engine, AsyncSessionLocal
    import asyncio
    try:
        async with asyncio.timeout(5.0):
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
        logger.info("Database initialized successfully with schema.")
    except Exception as exc:
        logger.warning(
            "Primary database connection failed (%s). Falling back to resilient local SQLite storage.",
            str(exc)
        )
        engine = build_engine(SQLITE_FALLBACK_URL)
        AsyncSessionLocal = async_sessionmaker(
            bind=engine,
            autoflush=False,
            autocommit=False,
            expire_on_commit=False,
        )
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Fallback local database initialized successfully.")

    # Seed Admin User if not exists
    await seed_default_admin()


async def seed_default_admin() -> None:
    """Ensures the admin account (eliphazyab@gmail.com) exists with role ADMIN."""
    from sqlalchemy import select
    from backend.app.db.models import User
    from backend.app.core.security import get_password_hash

    admin_email = settings.ADMIN_EMAIL.lower().strip()
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == admin_email))
        admin = result.scalar_one_or_none()
        if not admin:
            default_admin = User(
                email=admin_email,
                full_name="LisanHealth Administrator",
                hashed_password=get_password_hash("AdminLisan@2026!"),
                role="ADMIN",
                is_active=True,
            )
            session.add(default_admin)
            await session.commit()
            logger.info("Default Admin account seeded: %s", admin_email)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency yielding an async session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
