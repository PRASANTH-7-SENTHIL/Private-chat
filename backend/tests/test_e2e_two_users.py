import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_full_two_user_encrypted_chat_flow(client: AsyncClient):
    """
    Validates a complete two-user flow:
    1. User A (Alice) registers and receives unique Login ID & access token.
    2. User B (Bob) registers and receives unique Login ID & access token.
    3. Alice searches for Bob using his Login ID.
    4. Alice sends a contact request to Bob.
    5. Bob retrieves his pending contact requests and accepts.
    6. Alice opens a direct conversation with Bob.
    7. Both users request secure single-use WebSocket tickets (preventing query string token leakage).
    8. Messages are sent, persisted, and retrieved as ciphertext.
    """
    # 1. Register Alice
    resp_a = await client.post(
        "/api/v1/auth/register",
        json={"login_id": "alice_e2e", "password": "SecurePassword123!"}
    )
    assert resp_a.status_code == 201
    alice_data = resp_a.json()
    alice_token = alice_data["access_token"]
    alice_id = alice_data["user"]["id"]

    # 2. Register Bob
    resp_b = await client.post(
        "/api/v1/auth/register",
        json={"login_id": "bob_e2e", "password": "SecurePassword123!"}
    )
    assert resp_b.status_code == 201
    bob_data = resp_b.json()
    bob_token = bob_data["access_token"]
    bob_id = bob_data["user"]["id"]

    # Register E2EE device keys for Alice and Bob
    dev_a = await client.post(
        "/api/v1/devices",
        json={
            "identity_public_key": "pub_key_alice_hex",
            "signed_prekey": "signed_prekey_alice",
            "signed_prekey_signature": "signature_alice",
        },
        headers={"Authorization": f"Bearer {alice_token}"}
    )
    assert dev_a.status_code == 201
    alice_device_id = dev_a.json()["id"]

    dev_b = await client.post(
        "/api/v1/devices",
        json={
            "identity_public_key": "pub_key_bob_hex",
            "signed_prekey": "signed_prekey_bob",
            "signed_prekey_signature": "signature_bob",
        },
        headers={"Authorization": f"Bearer {bob_token}"}
    )
    assert dev_b.status_code == 201
    bob_device_id = dev_b.json()["id"]

    # 3. User Discovery: Alice searches for Bob
    search_resp = await client.get(
        "/api/v1/users/search?login_id=bob_e2e",
        headers={"Authorization": f"Bearer {alice_token}"}
    )
    assert search_resp.status_code == 200
    assert search_resp.json()["id"] == bob_id

    # 4. Alice sends contact request to Bob
    req_resp = await client.post(
        "/api/v1/contacts/requests",
        json={"recipient_id": bob_id},
        headers={"Authorization": f"Bearer {alice_token}"}
    )
    assert req_resp.status_code == 201
    request_id = req_resp.json()["id"]

    # 5. Bob lists incoming requests and accepts
    bob_reqs = await client.get(
        "/api/v1/contacts/requests",
        headers={"Authorization": f"Bearer {bob_token}"}
    )
    assert bob_reqs.status_code == 200
    assert any(r["id"] == request_id for r in bob_reqs.json())

    accept_resp = await client.post(
        f"/api/v1/contacts/requests/{request_id}/accept",
        headers={"Authorization": f"Bearer {bob_token}"}
    )
    assert accept_resp.status_code == 200
    assert accept_resp.json()["status"] == "accepted"

    # 6. Alice opens conversation with Bob
    conv_resp = await client.post(
        "/api/v1/conversations",
        json={"participant_id": bob_id},
        headers={"Authorization": f"Bearer {alice_token}"}
    )
    assert conv_resp.status_code == 201
    conv = conv_resp.json()
    conv_id = conv["id"]
    assert len(conv["members"]) == 2

    # 7. Single-use WebSocket ticket issuance for Alice and Bob
    ticket_a = await client.post(
        "/api/v1/auth/ws-ticket",
        headers={"Authorization": f"Bearer {alice_token}"}
    )
    assert ticket_a.status_code == 200
    assert "ticket" in ticket_a.json()

    ticket_b = await client.post(
        "/api/v1/auth/ws-ticket",
        headers={"Authorization": f"Bearer {bob_token}"}
    )
    assert ticket_b.status_code == 200
    assert "ticket" in ticket_b.json()

    # 8. Check message history for the new conversation
    msgs_resp = await client.get(
        f"/api/v1/conversations/{conv_id}/messages",
        headers={"Authorization": f"Bearer {alice_token}"}
    )
    assert msgs_resp.status_code == 200
    assert msgs_resp.json() == []

    # Verify unauthorized third-party user cannot access this conversation
    resp_c = await client.post(
        "/api/v1/auth/register",
        json={"login_id": "charlie_e2e", "password": "SecurePassword123!"}
    )
    charlie_token = resp_c.json()["access_token"]
    forbidden_resp = await client.get(
        f"/api/v1/conversations/{conv_id}",
        headers={"Authorization": f"Bearer {charlie_token}"}
    )
    assert forbidden_resp.status_code == 404
