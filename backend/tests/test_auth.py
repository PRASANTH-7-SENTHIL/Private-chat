import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_auto_login_id(client: AsyncClient):
    resp = await client.post("/api/v1/auth/register", json={"password": "Str0ngP@ssword123!"})
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["login_id"].startswith("user_")


@pytest.mark.asyncio
async def test_register_custom_login_id(client: AsyncClient):
    resp = await client.post(
        "/api/v1/auth/register",
        json={"login_id": "alice_test", "password": "Str0ngP@ssword123!"}
    )
    assert resp.status_code == 201
    assert resp.json()["user"]["login_id"] == "alice_test"


@pytest.mark.asyncio
async def test_register_duplicate_login_id(client: AsyncClient):
    await client.post(
        "/api/v1/auth/register",
        json={"login_id": "dup_user", "password": "Str0ngP@ssword123!"}
    )
    resp = await client.post(
        "/api/v1/auth/register",
        json={"login_id": "dup_user", "password": "OtherPassword456!"}
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_weak_password_rejected(client: AsyncClient):
    resp = await client.post("/api/v1/auth/register", json={"password": "short"})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    await client.post(
        "/api/v1/auth/register",
        json={"login_id": "logintest", "password": "TestPassword789!"}
    )
    resp = await client.post(
        "/api/v1/auth/login",
        json={"login_id": "logintest", "password": "TestPassword789!"}
    )
    assert resp.status_code == 200
    assert "access_token" in resp.json()
    assert resp.json()["user"]["login_id"] == "logintest"


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    resp = await client.post(
        "/api/v1/auth/login",
        json={"login_id": "nonexistent", "password": "wrongpassword"}
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_ws_ticket_generation(client: AsyncClient):
    reg = await client.post(
        "/api/v1/auth/register",
        json={"login_id": "ticket_user", "password": "TestPassword789!"}
    )
    token = reg.json()["access_token"]
    resp = await client.post(
        "/api/v1/auth/ws-ticket",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "ticket" in data
    assert data["expires_in"] == 45
