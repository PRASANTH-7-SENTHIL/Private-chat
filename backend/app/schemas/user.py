from pydantic import BaseModel
from datetime import datetime
import uuid


class UserPublic(BaseModel):
    id: uuid.UUID
    login_id: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
