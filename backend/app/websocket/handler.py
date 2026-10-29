import json
import uuid
from datetime import datetime, timezone
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from app.websocket.manager import manager
from app.websocket.events import ClientEvent, ServerEvent
from app.services.message_service import persist_message, get_messages
from app.services.conversation_service import is_member, get_user_conversations
from sqlalchemy import select


MAX_PAYLOAD_BYTES = 64 * 1024  # 64 KB


async def handle_websocket(
    websocket: WebSocket,
    user_id: str,
    device_id: str,
    db: AsyncSession,
) -> None:
    await manager.connect(websocket, user_id)

    # Broadcast presence to connected contacts
    await _broadcast_presence(db, user_id, online=True)

    try:
        while True:
            try:
                raw = await websocket.receive_text()
            except WebSocketDisconnect:
                break

            if len(raw) > MAX_PAYLOAD_BYTES:
                await websocket.send_text(json.dumps({
                    "type": ServerEvent.ERROR,
                    "payload": {"message": "Payload exceeds maximum allowed size (64KB)"},
                }))
                continue

            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({
                    "type": ServerEvent.ERROR,
                    "payload": {"message": "Invalid JSON format"},
                }))
                continue

            event_type = data.get("type")
            payload = data.get("payload", {})

            if event_type == ClientEvent.PING:
                await websocket.send_text(json.dumps({"type": ServerEvent.PONG, "payload": {}}))

            elif event_type == ClientEvent.MESSAGE_SEND:
                await _handle_message_send(websocket, user_id, device_id, payload, db)

            elif event_type == ClientEvent.MESSAGE_READ:
                await _handle_message_read(websocket, user_id, payload, db)

            elif event_type == ClientEvent.SYNC_REQUEST:
                await _handle_sync_request(websocket, user_id, payload, db)

            elif event_type == ClientEvent.PRESENCE_UPDATE:
                pass

            else:
                await websocket.send_text(json.dumps({
                    "type": ServerEvent.ERROR,
                    "payload": {"message": f"Unsupported event type: {event_type}"},
                }))

    finally:
        manager.disconnect(websocket, user_id)
        await _broadcast_presence(db, user_id, online=False)


async def _handle_message_send(
    websocket: WebSocket,
    user_id: str,
    device_id: str,
    payload: dict,
    db: AsyncSession,
) -> None:
    client_message_id = payload.get("client_message_id")
    conversation_id_str = payload.get("conversation_id")
    encrypted_payload = payload.get("encrypted_payload")
    protocol_version = payload.get("protocol_version", 0)

    if not all([client_message_id, conversation_id_str, encrypted_payload]):
        await websocket.send_text(json.dumps({
            "type": ServerEvent.ERROR,
            "payload": {"message": "client_message_id, conversation_id, and encrypted_payload are required"},
        }))
        return

    try:
        conversation_id = uuid.UUID(conversation_id_str)
    except (ValueError, AttributeError):
        await websocket.send_text(json.dumps({
            "type": ServerEvent.ERROR,
            "payload": {"message": "Invalid conversation UUID"},
        }))
        return

    # Check conversation membership
    if not await is_member(db, conversation_id, uuid.UUID(user_id)):
        await websocket.send_text(json.dumps({
            "type": ServerEvent.ERROR,
            "payload": {"message": "Unauthorized: Not a member of this conversation"},
        }))
        return

    # Resolve device_id (if not in token/ticket, resolve user's primary active device)
    dev_uuid = None
    if device_id:
        try:
            dev_uuid = uuid.UUID(device_id)
        except ValueError:
            pass
    if not dev_uuid:
        from app.models.device import Device
        dev_res = await db.execute(
            select(Device).where(Device.user_id == uuid.UUID(user_id), Device.revoked_at.is_(None)).order_by(Device.created_at.desc())
        )
        active_dev = dev_res.scalar_one_or_none()
        if active_dev:
            dev_uuid = active_dev.id
        else:
            # Create a virtual device entry if none exists
            dev = Device(
                user_id=uuid.UUID(user_id),
                identity_public_key="virtual_key",
                signed_prekey="virtual_prekey",
                signed_prekey_signature="virtual_sig",
            )
            db.add(dev)
            await db.flush()
            dev_uuid = dev.id

    # Persist message to database
    try:
        msg = await persist_message(
            db=db,
            client_message_id=str(client_message_id),
            conversation_id=conversation_id,
            sender_device_id=dev_uuid,
            encrypted_payload=str(encrypted_payload),
            protocol_version=int(protocol_version),
        )
        await db.commit()
    except Exception as e:
        await db.rollback()
        await websocket.send_text(json.dumps({
            "type": ServerEvent.ERROR,
            "payload": {"message": "Persistence failed or duplicate message"},
        }))
        return

    # Look up sender login_id
    from app.models.user import User
    user_result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    sender_user = user_result.scalar_one_or_none()
    sender_login_id = sender_user.login_id if sender_user else ""

    # Return ACK to sender
    await websocket.send_text(json.dumps({
        "type": ServerEvent.MESSAGE_ACK,
        "payload": {
            "client_message_id": client_message_id,
            "server_message_id": str(msg.id),
            "conversation_id": str(conversation_id),
            "server_sequence": msg.server_sequence,
        },
    }))

    # Broadcast to other conversation members
    from app.models.conversation import ConversationMember
    members_result = await db.execute(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id != uuid.UUID(user_id),
        )
    )
    recipients = members_result.scalars().all()

    new_msg_payload = {
        "id": str(msg.id),
        "client_message_id": str(client_message_id),
        "conversation_id": str(conversation_id),
        "sender_device_id": str(dev_uuid),
        "sender_id": user_id,
        "sender_login_id": sender_login_id,
        "encrypted_payload": encrypted_payload,
        "protocol_version": protocol_version,
        "server_sequence": msg.server_sequence,
        "created_at": msg.created_at.isoformat(),
        "status": "delivered",
    }

    for member in recipients:
        await manager.send_to_user(str(member.user_id), ServerEvent.MESSAGE_NEW, new_msg_payload)
        # Send delivered receipt back to sender if recipient is online
        if manager.is_online(str(member.user_id)):
            await manager.send_to_user(user_id, ServerEvent.MESSAGE_DELIVERED, {
                "client_message_id": client_message_id,
                "conversation_id": str(conversation_id),
                "recipient_id": str(member.user_id),
            })


async def _handle_message_read(
    websocket: WebSocket,
    user_id: str,
    payload: dict,
    db: AsyncSession,
) -> None:
    conversation_id_str = payload.get("conversation_id")
    if not conversation_id_str:
        return
    try:
        conv_id = uuid.UUID(conversation_id_str)
    except ValueError:
        return

    from app.models.conversation import ConversationMember
    members_result = await db.execute(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conv_id,
            ConversationMember.user_id != uuid.UUID(user_id),
        )
    )
    for member in members_result.scalars().all():
        await manager.send_to_user(str(member.user_id), ServerEvent.MESSAGE_READ, {
            "conversation_id": conversation_id_str,
            "reader_id": user_id,
        })


async def _handle_sync_request(
    websocket: WebSocket,
    user_id: str,
    payload: dict,
    db: AsyncSession,
) -> None:
    cursor = payload.get("cursor")
    convs = await get_user_conversations(db, uuid.UUID(user_id))
    for conv in convs:
        msgs = await get_messages(db, conv.id, cursor=int(cursor) if cursor else None, limit=50)
        for msg in msgs:
            await websocket.send_text(json.dumps({
                "type": ServerEvent.MESSAGE_NEW,
                "payload": msg,
            }))
    await websocket.send_text(json.dumps({
        "type": ServerEvent.SYNC_COMPLETE,
        "payload": {},
    }))


async def _broadcast_presence(db: AsyncSession, user_id: str, online: bool) -> None:
    from app.models.conversation import ConversationMember
    result = await db.execute(
        select(ConversationMember.user_id)
        .where(ConversationMember.user_id != uuid.UUID(user_id))
    )
    contact_ids = list(set(str(r[0]) for r in result.all()))
    await manager.broadcast_to_users(contact_ids, ServerEvent.PRESENCE_UPDATE, {
        "user_id": user_id,
        "online": online,
    })
