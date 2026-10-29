"""initial_schema

Revision ID: 001_initial
Revises: 
Create Date: 2026-10-29 09:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users table
    op.create_table(
        'users',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('login_id', sa.String(length=64), nullable=False),
        sa.Column('password_hash', sa.String(length=256), nullable=False),
        sa.Column('status', sa.Enum('active', 'inactive', 'blocked', name='userstatus'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_login_id'), 'users', ['login_id'], unique=True)

    # 2. devices table
    op.create_table(
        'devices',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('identity_public_key', sa.Text(), nullable=False),
        sa.Column('signed_prekey', sa.Text(), nullable=False),
        sa.Column('signed_prekey_signature', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_devices_user_id'), 'devices', ['user_id'], unique=False)

    # 3. conversations table
    op.create_table(
        'conversations',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('conversation_type', sa.Enum('direct', name='conversationtype'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # 4. conversation_members table
    op.create_table(
        'conversation_members',
        sa.Column('conversation_id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('joined_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('role', sa.String(length=32), nullable=False),
        sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('conversation_id', 'user_id'),
        sa.UniqueConstraint('conversation_id', 'user_id', name='uq_conv_member')
    )
    op.create_index(op.f('ix_conversation_members_user_id'), 'conversation_members', ['user_id'], unique=False)

    # 5. contact_requests table
    op.create_table(
        'contact_requests',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('sender_id', sa.Uuid(), nullable=False),
        sa.Column('recipient_id', sa.Uuid(), nullable=False),
        sa.Column('status', sa.Enum('pending', 'accepted', 'rejected', 'blocked', name='contactstatus'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['recipient_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['sender_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_contact_requests_recipient_id'), 'contact_requests', ['recipient_id'], unique=False)
    op.create_index(op.f('ix_contact_requests_sender_id'), 'contact_requests', ['sender_id'], unique=False)

    # 6. messages table
    op.create_table(
        'messages',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('client_message_id', sa.String(length=64), nullable=False),
        sa.Column('conversation_id', sa.Uuid(), nullable=False),
        sa.Column('sender_device_id', sa.Uuid(), nullable=False),
        sa.Column('encrypted_payload', sa.LargeBinary(), nullable=False),
        sa.Column('protocol_version', sa.Integer(), nullable=False),
        sa.Column('server_sequence', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['sender_device_id'], ['devices.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('sender_device_id', 'client_message_id', name='uq_device_client_msg')
    )
    op.create_index(op.f('ix_messages_client_message_id'), 'messages', ['client_message_id'], unique=False)
    op.create_index(op.f('ix_messages_conversation_id'), 'messages', ['conversation_id'], unique=False)
    op.create_index(op.f('ix_messages_created_at'), 'messages', ['created_at'], unique=False)
    op.create_index(op.f('ix_messages_sender_device_id'), 'messages', ['sender_device_id'], unique=False)
    op.create_index(op.f('ix_messages_server_sequence'), 'messages', ['server_sequence'], unique=False)

    # 7. message_receipts table
    op.create_table(
        'message_receipts',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('message_id', sa.Uuid(), nullable=False),
        sa.Column('recipient_device_id', sa.Uuid(), nullable=False),
        sa.Column('delivered_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['message_id'], ['messages.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['recipient_device_id'], ['devices.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_message_receipts_message_id'), 'message_receipts', ['message_id'], unique=False)
    op.create_index(op.f('ix_message_receipts_recipient_device_id'), 'message_receipts', ['recipient_device_id'], unique=False)

    # 8. refresh_sessions table
    op.create_table(
        'refresh_sessions',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('device_id', sa.Uuid(), nullable=True),
        sa.Column('hashed_session_token', sa.String(length=256), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['device_id'], ['devices.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_refresh_sessions_hashed_session_token'), 'refresh_sessions', ['hashed_session_token'], unique=True)
    op.create_index(op.f('ix_refresh_sessions_user_id'), 'refresh_sessions', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_table('refresh_sessions')
    op.drop_table('message_receipts')
    op.drop_table('messages')
    op.drop_table('contact_requests')
    op.drop_table('conversation_members')
    op.drop_table('conversations')
    op.drop_table('devices')
    op.drop_table('users')
