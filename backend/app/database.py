"""
SQLAlchemy async engine + session setup.
All models import `Base` from here so Alembic can find them via one metadata object.
"""

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base

from app.config import settings

engine = create_async_engine(settings.database_url, echo=True)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()


# FastAPI dependency: yields a DB session per request, closes it afterwards.
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
