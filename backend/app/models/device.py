import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Device(Base):
    __tablename__ = "devices"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    identity_public_key: Mapped[str] = mapped_column(Text, nullable=False)
    signed_prekey: Mapped[str] = mapped_column(Text, nullable=False)
    signed_prekey_signature: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="devices")  # type: ignore[name-defined]
    sent_messages: Mapped[list["Message"]] = relationship("Message", back_populates="sender_device", foreign_keys="Message.sender_device_id", lazy="select")  # type: ignore[name-defined]
