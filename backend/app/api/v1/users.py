import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.user_service import search_user_by_login_id
from app.services.device_service import get_user_key_bundle
from app.api.v1.deps import get_current_user

router = APIRouter()


@router.get("/search")
async def search_users(
    login_id: str = Query(..., min_length=1, max_length=64),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    user = await search_user_by_login_id(db, login_id.strip())
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    # Never expose passwords, tokens, or private secrets
    return {
        "id": str(user.id),
        "login_id": user.login_id,
        "status": user.status.value,
        "created_at": user.created_at.isoformat(),
    }


@router.get("/{user_id}/key-bundle")
async def get_key_bundle(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    bundle = await get_user_key_bundle(db, user_id)
    if bundle is None:
        raise HTTPException(status_code=404, detail="Key bundle not found for user")
    return bundle
