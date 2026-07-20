import asyncio
from collections.abc import AsyncIterator
from functools import lru_cache

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import get_settings


@lru_cache
def get_engine() -> AsyncEngine:
    settings = get_settings()
    return create_async_engine(
        settings.database_url,
        echo=settings.database_echo,
        pool_pre_ping=True,
    )


@lru_cache
def get_session_factory() -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(get_engine(), expire_on_commit=False)


async def get_db_session() -> AsyncIterator[AsyncSession]:
    async with get_session_factory()() as session:
        yield session


async def database_is_ready() -> bool:
    settings = get_settings()

    try:
        async with get_engine().connect() as connection:
            await asyncio.wait_for(
                connection.execute(text("SELECT 1")),
                timeout=settings.database_connect_timeout_seconds,
            )
    except (TimeoutError, SQLAlchemyError):
        return False

    return True


async def dispose_engine() -> None:
    if get_engine.cache_info().currsize > 0:
        await get_engine().dispose()
    get_session_factory.cache_clear()
    get_engine.cache_clear()
