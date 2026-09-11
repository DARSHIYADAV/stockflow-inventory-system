import os
import uuid

# Tests must never run against the dev database (they truncate tables between
# runs). Point at a dedicated test database before any app module is imported,
# since app.database creates its engine at import time from this env var.
os.environ["DATABASE_URL"] = "postgresql+asyncpg://stockflow:stockflow@db:5432/stockflow_test"

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text

from app.core.security import create_access_token, hash_password
from app.database import AsyncSessionLocal, engine
from app.main import app
from app.models.user import User, UserRole

TABLES_IN_DELETE_ORDER = [
    "asset_history",
    "assets",
    "stock_transactions",
    "products",
    "users",
]


@pytest_asyncio.fixture(autouse=True)
async def _clean_tables():
    assert engine.url.database == "stockflow_test", (
        "Refusing to run tests against a non-test database: "
        f"{engine.url.database!r}. This fixture truncates tables."
    )
    # pytest-asyncio gives each test its own event loop; dispose the pool so
    # no connection from a previous test's loop is reused on this one.
    await engine.dispose()
    yield
    async with engine.begin() as connection:
        for table in TABLES_IN_DELETE_ORDER:
            await connection.execute(text(f"DELETE FROM {table}"))


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


async def _make_user(role: UserRole) -> User:
    async with AsyncSessionLocal() as session:
        user = User(
            name=f"{role.value}-{uuid.uuid4().hex[:6]}",
            email=f"{role.value}-{uuid.uuid4().hex[:6]}@stockflow.com",
            password_hash=hash_password("password123"),
            role=role,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user


@pytest_asyncio.fixture
async def admin_user():
    return await _make_user(UserRole.admin)


@pytest_asyncio.fixture
async def second_admin_user():
    return await _make_user(UserRole.admin)


@pytest_asyncio.fixture
async def manager_user():
    return await _make_user(UserRole.manager)


@pytest_asyncio.fixture
async def employee_user():
    return await _make_user(UserRole.employee)


def auth_headers(user: User) -> dict:
    token = create_access_token(user_id=user.id, role=user.role.value)
    return {"Authorization": f"Bearer {token}"}
