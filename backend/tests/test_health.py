from datetime import datetime
from starlette.testclient import TestClient


def test_root_endpoint(client: TestClient):
    """Test that the root entry point returns service metadata."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "LisanHealth"
    assert "version" in data
    assert data["docs_url"] == "/docs"
    assert data["api_v1_health"] == "/api/v1/health"


def test_health_endpoint(client: TestClient):
    """Test the liveness /api/v1/health endpoint."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["version"] == "0.1.0"
    assert "environment" in data
    assert "timestamp" in data
    # Verify timestamp format is ISO-8601 compliant
    parsed_time = datetime.fromisoformat(data["timestamp"])
    assert parsed_time is not None


def test_readiness_endpoint(client: TestClient):
    """Test the readiness probe /api/v1/ready."""
    response = client.get("/api/v1/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["ready", "degraded"]
    assert data["storage_ready"] is True
    assert "reasoning_provider" in data
    assert "localization_provider" in data
    assert data["localization_provider"] == "addis_ai"
