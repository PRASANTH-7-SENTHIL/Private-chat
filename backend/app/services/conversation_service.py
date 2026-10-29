import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from app.models.conversation import Conversation, ConversationMember, ConversationType
from app.models.contact import ContactRequest, ContactStatus


async def get_or_create_direct_conversation(
    db: AsyncSession,
    user1_id: uuid.UUID,
    user2_id: uuid.UUID,
) -> Conversation:
    # Check contact relationship
    result = await db.execute(
        select(ContactRequest).where(
            and_(
                ContactRequest.status == ContactStatus.accepted,
            )
        ).where(
            (
                (ContactRequest.sender_id == user1_id) & (ContactRequest.recipient_id == user2_id)
            ) | (
                (ContactRequest.sender_id == user2_id) & (ContactRequest.recipient_id == user1_id)
            )
        )
    )
    if result.scalar_one_or_none() is None:
        raise ValueError("Users are not contacts")

    # Look for existing conversation
    result = await db.execute(
        select(ConversationMember.conversation_id)
        .where(ConversationMember.user_id == user1_id)
    )
    user1_convs = set(r[0] for r in result.all())

    result = await db.execute(
        select(ConversationMember.conversation_id)
        .where(ConversationMember.user_id == user2_id)
    )
    user2_convs = set(r[0] for r in result.all())
    shared = user1_convs & user2_convs

    if shared:
        conv_id = next(iter(shared))
        result = await db.execute(
            select(Conversation)
            .options(selectinload(Conversation.members).selectinload(ConversationMember.user))
            .where(Conversation.id == conv_id)
        )
        return result.scalar_one()

    # Create new
    conv = Conversation(conversation_type=ConversationType.direct)
    db.add(conv)
    await db.flush()

    for uid in [user1_id, user2_id]:
        member = ConversationMember(conversation_id=conv.id, user_id=uid)
        db.add(member)
    await db.flush()

    result = await db.execute(
        select(Conversation)
        .options(selectinload(Conversation.members).selectinload(ConversationMember.user))
        .where(Conversation.id == conv.id)
    )
    return result.scalar_one()


async def get_user_conversations(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> list[Conversation]:
    result = await db.execute(
        select(Conversation)
        .join(ConversationMember, ConversationMember.conversation_id == Conversation.id)
        .where(ConversationMember.user_id == user_id)
        .options(selectinload(Conversation.members).selectinload(ConversationMember.user))
        .order_by(Conversation.updated_at.desc())
    )
    return list(result.scalars().unique().all())


async def get_conversation(
    db: AsyncSession,
    conversation_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Conversation | None:
    result = await db.execute(
        select(Conversation)
        .join(ConversationMember, ConversationMember.conversation_id == Conversation.id)
        .where(
            Conversation.id == conversation_id,
            ConversationMember.user_id == user_id,
        )
        .options(selectinload(Conversation.members).selectinload(ConversationMember.user))
    )
    return result.scalar_one_or_none()


async def is_member(
    db: AsyncSession,
    conversation_id: uuid.UUID,
    user_id: uuid.UUID,
) -> bool:
    result = await db.execute(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == user_id,
        )
    )
    return result.scalar_one_or_none() is not None
