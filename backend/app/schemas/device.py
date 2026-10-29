from pydantic import BaseModel
from datetime import datetime
import uuid


class DeviceRegisterRequest(BaseModel):
    identity_public_key: str
    signed_prekey: str
    signed_prekey_signature: str
    one_time_prekeys: list[str] = []


class DeviceResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    identity_public_key: str
    signed_prekey: str
    signed_prekey_signature: str
    created_at: datetime
    revoked_at: datetime | None

    model_config = {"from_attributes": True}


class KeyBundleResponse(BaseModel):
    user_id: uuid.UUID
    device_id: uuid.UUID
    identity_public_key: str
    signed_prekey: str
    signed_prekey_signature: str
    one_time_prekeys: list[str] = []
