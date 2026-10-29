import uuid
import base64
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.message import Message
from app.models.device import Device
from app.models.user import User
from app.models.conversation import ConversationMember


async def persist_message(
    db: AsyncSession,
    client_message_id: str,
    conversation_id: uuid.UUID,
    sender_device_id: uuid.UUID,
    encrypted_payload: str,
    protocol_version: int,
) -> Message:
    payload_bytes = encrypted_payload.encode("utf-8") if isinstance(encrypted_payload, str) else encrypted_payload

    msg = Message(
        client_message_id=client_message_id,
        conversation_id=conversation_id,
        sender_device_id=sender_device_id,
        encrypted_payload=payload_bytes,
        protocol_version=protocol_version,
        server_sequence=int(datetime.now(timezone.utc).timestamp() * 1000),
    )
    db.add(msg)
    await db.flush()
    await db.refresh(msg)
    return msg


async def get_messages(
    db: AsyncSession,
    conversation_id: uuid.UUID,
    cursor: int | None = None,
    limit: int = 50,
) -> list[dict]:
    query = (
        select(Message, Device.user_id, User.login_id)
        .join(Device, Message.sender_device_id == Device.id)
        .join(User, Device.user_id == User.id)
        .where(Message.conversation_id == conversation_id)
    )
    if cursor:
        query = query.where(Message.server_sequence < cursor)
    query = query.order_by(Message.server_sequence.desc()).limit(limit)

    result = await db.execute(query)
    rows = result.all()

    messages = []
    for row in reversed(rows):
        msg, sender_user_id, sender_login_id = row
        payload = msg.encrypted_payload
        if isinstance(payload, bytes):
            encoded = payload.decode("utf-8")
        else:
            encoded = payload
        messages.append({
            "id": str(msg.id),
            "client_message_id": msg.client_message_id,
            "conversation_id": str(msg.conversation_id),
            "sender_device_id": str(msg.sender_device_id),
            "sender_id": str(sender_user_id),
            "sender_login_id": sender_login_id,
            "encrypted_payload": encoded,
            "protocol_version": msg.protocol_version,
            "server_sequence": msg.server_sequence,
            "created_at": msg.created_at.isoformat(),
            "status": "delivered",
        })
    return messages
