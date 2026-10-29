import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, LargeBinary, BigInteger, UniqueConstraint, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Message(Base):
    __tablename__ = "messages"
    __table_args__ = (UniqueConstraint("sender_device_id", "client_message_id", name="uq_device_client_msg"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_message_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    conversation_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_device_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("devices.id"), nullable=False, index=True)
    encrypted_payload: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    protocol_version: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    server_sequence: Mapped[int] = mapped_column(BigInteger, nullable=False, autoincrement=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)

    conversation: Mapped["Conversation"] = relationship("Conversation", back_populates="messages")  # type: ignore[name-defined]
    sender_device: Mapped["Device"] = relationship("Device", back_populates="sent_messages", foreign_keys=[sender_device_id])  # type: ignore[name-defined]
    receipts: Mapped[list["MessageReceipt"]] = relationship("MessageReceipt", back_populates="message", lazy="select")


class MessageReceipt(Base):
    __tablename__ = "message_receipts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    message_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_device_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("devices.id"), nullable=False, index=True)
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    message: Mapped["Message"] = relationship("Message", back_populates="receipts")
