import pytest
from httpx import AsyncClient


async def _register(client: AsyncClient, login_id: str, password: str = "Str0ngP@ss123!") -> dict:
    resp = await client.post("/api/v1/auth/register", json={"login_id": login_id, "password": password})
    return resp.json()


@pytest.mark.asyncio
async def test_create_conversation_requires_contacts(client: AsyncClient):
    alice = await _register(client, "alice_conv")
    bob = await _register(client, "bob_conv")
    alice_token = alice["access_token"]
    bob_id = bob["user"]["id"]

    # Without being contacts, conversation creation must fail
    resp = await client.post(
        "/api/v1/conversations",
        json={"participant_id": bob_id},
        headers={"Authorization": f"Bearer {alice_token}"},
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_create_and_fetch_conversation_as_contacts(client: AsyncClient):
    alice = await _register(client, "alice_conv2")
    bob = await _register(client, "bob_conv2")
    alice_token = alice["access_token"]
    bob_id = bob["user"]["id"]
    bob_token = bob["access_token"]

    # Establish contact
    req = await client.post(
        "/api/v1/contacts/requests",
        json={"recipient_id": bob_id},
        headers={"Authorization": f"Bearer {alice_token}"},
    )
    req_id = req.json()["id"]
    await client.post(
        f"/api/v1/contacts/requests/{req_id}/accept",
        headers={"Authorization": f"Bearer {bob_token}"},
    )

    # Alice opens conversation
    resp = await client.post(
        "/api/v1/conversations",
        json={"participant_id": bob_id},
        headers={"Authorization": f"Bearer {alice_token}"},
    )
    assert resp.status_code == 201
    data = resp.json()
    conv_id = data["id"]
    assert len(data["members"]) == 2

    # Listing conversations
    list_resp = await client.get(
        "/api/v1/conversations",
        headers={"Authorization": f"Bearer {alice_token}"},
    )
    assert list_resp.status_code == 200
    assert any(c["id"] == conv_id for c in list_resp.json())

    # Listing messages in empty conversation
    msg_resp = await client.get(
        f"/api/v1/conversations/{conv_id}/messages",
        headers={"Authorization": f"Bearer {alice_token}"},
    )
    assert msg_resp.status_code == 200
    assert msg_resp.json() == []
