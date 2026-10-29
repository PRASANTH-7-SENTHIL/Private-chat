from pydantic import BaseModel
from datetime import datetime
import uuid


class MessageResponse(BaseModel):
    id: uuid.UUID
    client_message_id: str
    conversation_id: uuid.UUID
    sender_device_id: uuid.UUID
    sender_id: uuid.UUID
    sender_login_id: str
    encrypted_payload: str  # base64-encoded
    protocol_version: int
    server_sequence: int
    created_at: datetime
    status: str = "delivered"

    model_config = {"from_attributes": True}
