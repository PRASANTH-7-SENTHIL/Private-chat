import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload
from app.models.contact import ContactRequest, ContactStatus
from app.models.user import User


async def send_contact_request(
    db: AsyncSession,
    sender_id: uuid.UUID,
    recipient_id: uuid.UUID,
) -> ContactRequest:
    if sender_id == recipient_id:
        raise ValueError("Cannot send a contact request to yourself")

    result = await db.execute(
        select(ContactRequest).where(
            or_(
                and_(ContactRequest.sender_id == sender_id, ContactRequest.recipient_id == recipient_id),
                and_(ContactRequest.sender_id == recipient_id, ContactRequest.recipient_id == sender_id),
            )
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        if existing.status == ContactStatus.accepted:
            raise ValueError("Already connected")
        if existing.status == ContactStatus.pending:
            raise ValueError("Request already pending")
        if existing.status == ContactStatus.blocked:
            raise ValueError("Cannot send request")

    req = ContactRequest(sender_id=sender_id, recipient_id=recipient_id)
    db.add(req)
    await db.flush()
    await db.refresh(req)
    return req


async def get_contact_requests(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> list[ContactRequest]:
    result = await db.execute(
        select(ContactRequest)
        .options(selectinload(ContactRequest.sender), selectinload(ContactRequest.recipient))
        .where(
            or_(
                ContactRequest.sender_id == user_id,
                ContactRequest.recipient_id == user_id,
            )
        ).order_by(ContactRequest.created_at.desc())
    )
    return list(result.scalars().all())


async def accept_request(
    db: AsyncSession,
    request_id: uuid.UUID,
    user_id: uuid.UUID,
) -> ContactRequest:
    result = await db.execute(
        select(ContactRequest).where(
            ContactRequest.id == request_id,
            ContactRequest.recipient_id == user_id,
            ContactRequest.status == ContactStatus.pending,
        )
    )
    req = result.scalar_one_or_none()
    if req is None:
        raise ValueError("Request not found or not authorized")
    req.status = ContactStatus.accepted
    await db.flush()
    return req


async def reject_request(
    db: AsyncSession,
    request_id: uuid.UUID,
    user_id: uuid.UUID,
) -> ContactRequest:
    result = await db.execute(
        select(ContactRequest).where(
            ContactRequest.id == request_id,
            ContactRequest.recipient_id == user_id,
            ContactRequest.status == ContactStatus.pending,
        )
    )
    req = result.scalar_one_or_none()
    if req is None:
        raise ValueError("Request not found or not authorized")
    req.status = ContactStatus.rejected
    await db.flush()
    return req


async def get_accepted_contacts(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> list[User]:
    result = await db.execute(
        select(ContactRequest).where(
            or_(
                ContactRequest.sender_id == user_id,
                ContactRequest.recipient_id == user_id,
            ),
            ContactRequest.status == ContactStatus.accepted,
        )
    )
    requests = result.scalars().all()
    contact_ids = [
        r.recipient_id if r.sender_id == user_id else r.sender_id
        for r in requests
    ]
    if not contact_ids:
        return []
    users_result = await db.execute(select(User).where(User.id.in_(contact_ids)))
    return list(users_result.scalars().all())


async def block_contact(
    db: AsyncSession,
    blocker_id: uuid.UUID,
    blocked_id: uuid.UUID,
) -> None:
    result = await db.execute(
        select(ContactRequest).where(
            or_(
                and_(ContactRequest.sender_id == blocker_id, ContactRequest.recipient_id == blocked_id),
                and_(ContactRequest.sender_id == blocked_id, ContactRequest.recipient_id == blocker_id),
            )
        )
    )
    req = result.scalar_one_or_none()
    if req:
        req.status = ContactStatus.blocked
    else:
        req = ContactRequest(
            sender_id=blocker_id,
            recipient_id=blocked_id,
            status=ContactStatus.blocked,
        )
        db.add(req)
    await db.flush()
