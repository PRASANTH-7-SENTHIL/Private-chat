import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.services.conversation_service import (
    get_or_create_direct_conversation, get_user_conversations,
    get_conversation
)
from app.services.message_service import get_messages
from app.schemas.conversation import ConversationCreate

router = APIRouter()


@router.post("", status_code=201)
async def create_conversation(
    body: ConversationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        conv = await get_or_create_direct_conversation(db, current_user.id, body.participant_id)
        await db.commit()
        return _conv_response(conv)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("")
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    convs = await get_user_conversations(db, current_user.id)
    return [_conv_response(c) for c in convs]


@router.get("/{conversation_id}")
async def get_conv(
    conversation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = await get_conversation(db, conversation_id, current_user.id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return _conv_response(conv)


@router.get("/{conversation_id}/messages")
async def list_messages(
    conversation_id: uuid.UUID,
    cursor: int | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = await get_conversation(db, conversation_id, current_user.id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    msgs = await get_messages(db, conversation_id, cursor=cursor, limit=50)
    return msgs


def _conv_response(conv) -> dict:
    return {
        "id": str(conv.id),
        "conversation_type": conv.conversation_type.value,
        "members": [
            {
                "user_id": str(m.user_id),
                "login_id": m.user.login_id if m.user else "",
                "joined_at": m.joined_at.isoformat(),
                "role": m.role,
            }
            for m in conv.members
        ],
        "created_at": conv.created_at.isoformat(),
        "updated_at": conv.updated_at.isoformat(),
    }
