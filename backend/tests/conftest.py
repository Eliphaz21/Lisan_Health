import pytest
from typing import AsyncGenerator
from starlette.testclient import TestClient
import httpx
from backend.app.main import app


@pytest.fixture(scope="session")
def client() -> TestClient:
    """Synchronous test client fixture."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
async def async_client() -> AsyncGenerator[httpx.AsyncClient, None]:
    """Asynchronous HTTP test client fixture."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
