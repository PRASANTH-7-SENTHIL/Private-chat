import pytest
from httpx import AsyncClient


async def _register(client: AsyncClient, login_id: str, password: str = "Str0ngP@ss123!") -> dict:
    resp = await client.post("/api/v1/auth/register", json={"login_id": login_id, "password": password})
    return resp.json()


@pytest.mark.asyncio
async def test_contact_request_workflow(client: AsyncClient):
    alice = await _register(client, "alice_contacts")
    bob = await _register(client, "bob_contacts")

    alice_token = alice["access_token"]
    bob_id = bob["user"]["id"]
    bob_token = bob["access_token"]

    # Search user
    search_resp = await client.get(
        f"/api/v1/users/search?login_id=bob_contacts",
        headers={"Authorization": f"Bearer {alice_token}"},
    )
    assert search_resp.status_code == 200
    assert search_resp.json()["id"] == bob_id

    # Alice sends contact request to Bob
    req_resp = await client.post(
        "/api/v1/contacts/requests",
        json={"recipient_id": bob_id},
        headers={"Authorization": f"Bearer {alice_token}"},
    )
    assert req_resp.status_code == 201
    req_id = req_resp.json()["id"]

    # Bob lists incoming requests
    list_resp = await client.get(
        "/api/v1/contacts/requests",
        headers={"Authorization": f"Bearer {bob_token}"},
    )
    assert list_resp.status_code == 200
    requests = list_resp.json()
    assert any(r["id"] == req_id for r in requests)

    # Bob accepts request
    accept_resp = await client.post(
        f"/api/v1/contacts/requests/{req_id}/accept",
        headers={"Authorization": f"Bearer {bob_token}"},
    )
    assert accept_resp.status_code == 200
    assert accept_resp.json()["status"] == "accepted"

    # Alice lists contacts
    contacts_resp = await client.get(
        "/api/v1/contacts",
        headers={"Authorization": f"Bearer {alice_token}"},
    )
    assert contacts_resp.status_code == 200
    contacts = contacts_resp.json()
    assert any(c["id"] == bob_id for c in contacts)
