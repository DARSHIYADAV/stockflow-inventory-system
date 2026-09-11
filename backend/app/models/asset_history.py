import uuid
import enum
from datetime import datetime

from sqlalchemy import String, Enum, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class AssetHistoryAction(str, enum.Enum):
    assigned = "assigned"
    returned = "returned"


class AssetHistory(Base):
    """
    Audit trail for asset assignment/return events — nothing about an
    asset's assignment is ever silently overwritten, it's appended here.
    """

    __tablename__ = "asset_history"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    asset_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assets.id"), nullable=False
    )
    action: Mapped[AssetHistoryAction] = mapped_column(
        Enum(AssetHistoryAction, name="asset_history_action"), nullable=False
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    actor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    note: Mapped[str] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
