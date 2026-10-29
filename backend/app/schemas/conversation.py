from pydantic import BaseModel
from datetime import datetime
import uuid


class ConversationCreate(BaseModel):
    participant_id: uuid.UUID


class MemberResponse(BaseModel):
    user_id: uuid.UUID
    login_id: str
    joined_at: datetime
    role: str


class ConversationResponse(BaseModel):
    id: uuid.UUID
    conversation_type: str
    members: list[MemberResponse]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
