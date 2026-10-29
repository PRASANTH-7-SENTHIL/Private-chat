from pydantic import BaseModel
from datetime import datetime
import uuid


class ContactRequestCreate(BaseModel):
    recipient_id: uuid.UUID


class ContactRequestResponse(BaseModel):
    id: uuid.UUID
    sender_id: uuid.UUID
    sender_login_id: str
    recipient_id: uuid.UUID
    recipient_login_id: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ContactResponse(BaseModel):
    id: uuid.UUID
    login_id: str
    status: str
    conversation_id: uuid.UUID | None = None
