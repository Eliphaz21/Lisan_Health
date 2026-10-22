"""
Unit & Integration Tests for User Authentication, RBAC, Admin Panel, and Clinical History.
"""

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.core.config import settings


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_user_registration_and_login_flow(client: TestClient):
    """Verifies that a standard user can register, receive a JWT token, and login."""
    # 1. Register a new user
    reg_payload = {
        "email": "patient.test@example.com",
        "full_name": "Abebe Bikila",
        "password": "SecurePassword123!"
    }
    reg_res = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code in [201, 409]  # 201 if first time, 409 if already exists

    # 2. Login
    login_payload = {
        "email": "patient.test@example.com",
        "password": "SecurePassword123!"
    }
    login_res = client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code == 200
    data = login_res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "patient.test@example.com"
    assert data["user"]["role"] == "USER"

    token = data["access_token"]

    # 3. Access /auth/me with Bearer token
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["full_name"] == "Abebe Bikila"


def test_designated_admin_email_gets_admin_role(client: TestClient):
    """Verifies that eliphazyab@gmail.com automatically receives ADMIN role upon registration."""
    admin_payload = {
        "email": settings.ADMIN_EMAIL,
        "full_name": "Eliphaz Admin",
        "password": "SuperAdminPassword2026!"
    }
    # Attempt register (or login if seeded)
    reg_res = client.post("/api/v1/auth/register", json=admin_payload)
    if reg_res.status_code == 201:
        assert reg_res.json()["user"]["role"] == "ADMIN"
    else:
        # Seeded default admin password is AdminLisan@2026!
        login_res = client.post("/api/v1/auth/login", json={
            "email": settings.ADMIN_EMAIL,
            "password": "AdminLisan@2026!"
        })
        assert login_res.status_code == 200
        assert login_res.json()["user"]["role"] == "ADMIN"


def test_regular_user_forbidden_from_admin_endpoints(client: TestClient):
    """Verifies RBAC: Standard user receives 403 Forbidden on /admin endpoints."""
    # Login as regular user
    login_res = client.post("/api/v1/auth/login", json={
        "email": "patient.test@example.com",
        "password": "SecurePassword123!"
    })
    token = login_res.json()["access_token"]

    # Try to access admin users list
    admin_res = client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert admin_res.status_code == 403
    assert "Admin privileges required" in admin_res.json()["detail"]


def test_admin_can_access_dashboard_and_stats(client: TestClient):
    """Verifies that an admin user can access platform stats and list users."""
    login_res = client.post("/api/v1/auth/login", json={
        "email": settings.ADMIN_EMAIL,
        "password": "AdminLisan@2026!"
    })
    assert login_res.status_code == 200
    admin_token = login_res.json()["access_token"]

    # 1. Admin stats
    stats_res = client.get("/api/v1/admin/stats", headers={"Authorization": f"Bearer {admin_token}"})
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert "users" in stats
    assert "reports" in stats
    assert "infrastructure" in stats

    # 2. Admin settings (masked keys)
    settings_res = client.get("/api/v1/admin/settings", headers={"Authorization": f"Bearer {admin_token}"})
    assert settings_res.status_code == 200
    settings_data = settings_res.json()
    assert settings_data["admin_email"] == settings.ADMIN_EMAIL
    assert "addis_ai" in settings_data

    # 3. List users
    users_res = client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert users_res.status_code == 200
    assert len(users_res.json()) >= 1


def test_user_history_save_and_retrieve(client: TestClient):
    """Verifies that an authenticated user can save a report to history and retrieve it."""
    login_res = client.post("/api/v1/auth/login", json={
        "email": "patient.test@example.com",
        "password": "SecurePassword123!"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Save a report
    save_payload = {
        "report_id": "SYN-CBC-HIST-01",
        "panel_name": "Complete Blood Count",
        "language": "am",
        "raw_text": "HGB: 9.2 g/dL",
        "extracted_json": "{}",
        "explanation_json": "{}",
        "audio_url": "/api/v1/speech/audio/test1234"
    }
    save_res = client.post("/api/v1/history/save", json=save_payload, headers=headers)
    assert save_res.status_code == 201
    record_id = save_res.json()["id"]

    # Retrieve history
    hist_res = client.get("/api/v1/history", headers=headers)
    assert hist_res.status_code == 200
    records = hist_res.json()
    assert any(r["id"] == record_id for r in records)

    # Delete history
    del_res = client.delete(f"/api/v1/history/{record_id}", headers=headers)
    assert del_res.status_code == 200
