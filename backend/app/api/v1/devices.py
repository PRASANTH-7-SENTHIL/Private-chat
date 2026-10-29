import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.services.device_service import register_device, get_user_devices, revoke_device
from app.schemas.device import DeviceRegisterRequest

router = APIRouter()


@router.get("")
async def list_devices(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    devices = await get_user_devices(db, current_user.id)
    return [
        {
            "id": str(d.id),
            "user_id": str(d.user_id),
            "identity_public_key": d.identity_public_key,
            "signed_prekey": d.signed_prekey,
            "signed_prekey_signature": d.signed_prekey_signature,
            "created_at": d.created_at.isoformat(),
            "revoked_at": d.revoked_at.isoformat() if d.revoked_at else None,
        }
        for d in devices
    ]


@router.post("", status_code=201)
async def register(
    body: DeviceRegisterRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    device = await register_device(
        db,
        current_user.id,
        body.identity_public_key,
        body.signed_prekey,
        body.signed_prekey_signature,
        body.one_time_prekeys,
    )
    await db.commit()
    return {
        "id": str(device.id),
        "user_id": str(device.user_id),
        "identity_public_key": device.identity_public_key,
        "signed_prekey": device.signed_prekey,
        "signed_prekey_signature": device.signed_prekey_signature,
        "created_at": device.created_at.isoformat(),
        "revoked_at": None,
    }


@router.delete("/{device_id}")
async def revoke(
    device_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    device = await revoke_device(db, device_id, current_user.id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    await db.commit()
    return {"status": "revoked"}
