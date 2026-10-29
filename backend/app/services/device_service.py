import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.device import Device


async def register_device(
    db: AsyncSession,
    user_id: uuid.UUID,
    identity_public_key: str,
    signed_prekey: str,
    signed_prekey_signature: str,
    one_time_prekeys: list[str] | None = None,
) -> Device:
    device = Device(
        user_id=user_id,
        identity_public_key=identity_public_key,
        signed_prekey=signed_prekey,
        signed_prekey_signature=signed_prekey_signature,
    )
    db.add(device)
    await db.flush()
    await db.refresh(device)
    return device


async def get_user_devices(db: AsyncSession, user_id: uuid.UUID) -> list[Device]:
    result = await db.execute(
        select(Device).where(Device.user_id == user_id).order_by(Device.created_at.desc())
    )
    return list(result.scalars().all())


async def revoke_device(db: AsyncSession, device_id: uuid.UUID, user_id: uuid.UUID) -> Device | None:
    result = await db.execute(
        select(Device).where(Device.id == device_id, Device.user_id == user_id)
    )
    device = result.scalar_one_or_none()
    if device:
        device.revoked_at = datetime.now(timezone.utc)
        await db.flush()
    return device


async def get_user_key_bundle(db: AsyncSession, user_id: uuid.UUID) -> dict | None:
    result = await db.execute(
        select(Device).where(
            Device.user_id == user_id,
            Device.revoked_at.is_(None),
        ).order_by(Device.created_at.desc())
    )
    device = result.scalar_one_or_none()
    if device is None:
        return None
    return {
        "user_id": str(user_id),
        "device_id": str(device.id),
        "identity_public_key": device.identity_public_key,
        "signed_prekey": device.signed_prekey,
        "signed_prekey_signature": device.signed_prekey_signature,
        "one_time_prekeys": [],
    }
