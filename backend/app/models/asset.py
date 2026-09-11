import uuid
import enum
from datetime import date, datetime

from sqlalchemy import String, Enum, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class AssetStatus(str, enum.Enum):
    available = "available"
    assigned = "assigned"
    retired = "retired"


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    asset_tag: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id"), nullable=False
    )
    serial_number: Mapped[str] = mapped_column(String, nullable=True)
    status: Mapped[AssetStatus] = mapped_column(
        Enum(AssetStatus, name="asset_status"), nullable=False, default=AssetStatus.available
    )
    assigned_to: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    purchase_date: Mapped[date] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
