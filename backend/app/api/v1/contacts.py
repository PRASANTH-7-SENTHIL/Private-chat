import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.services.contact_service import (
    send_contact_request, get_contact_requests, accept_request,
    reject_request, get_accepted_contacts, block_contact
)
from app.schemas.contact import ContactRequestCreate

router = APIRouter()


@router.post("/requests", status_code=201)
async def create_contact_request(
    body: ContactRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        req = await send_contact_request(db, current_user.id, body.recipient_id)
        await db.commit()
        return {
            "id": str(req.id),
            "sender_id": str(req.sender_id),
            "sender_login_id": current_user.login_id,
            "recipient_id": str(req.recipient_id),
            "status": req.status.value,
            "created_at": req.created_at.isoformat(),
            "updated_at": req.updated_at.isoformat(),
        }
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.get("/requests")
async def list_contact_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    requests = await get_contact_requests(db, current_user.id)
    result = []
    for req in requests:
        result.append({
            "id": str(req.id),
            "sender_id": str(req.sender_id),
            "sender_login_id": req.sender.login_id if req.sender else "",
            "recipient_id": str(req.recipient_id),
            "recipient_login_id": req.recipient.login_id if req.recipient else "",
            "status": req.status.value,
            "created_at": req.created_at.isoformat(),
            "updated_at": req.updated_at.isoformat(),
        })
    return result


@router.post("/requests/{request_id}/accept")
async def accept_contact_req(
    request_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        req = await accept_request(db, request_id, current_user.id)
        await db.commit()
        return {"id": str(req.id), "status": req.status.value}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/requests/{request_id}/reject")
async def reject_contact_req(
    request_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        req = await reject_request(db, request_id, current_user.id)
        await db.commit()
        return {"id": str(req.id), "status": req.status.value}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("")
async def list_contacts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contacts = await get_accepted_contacts(db, current_user.id)
    return [{"id": str(c.id), "login_id": c.login_id, "status": c.status.value} for c in contacts]


@router.post("/{contact_id}/block")
async def block(
    contact_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await block_contact(db, current_user.id, contact_id)
    await db.commit()
    return {"status": "blocked"}
