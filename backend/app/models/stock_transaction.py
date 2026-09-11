import uuid
from datetime import datetime

from sqlalchemy import String, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class StockTransaction(Base):
    """
    Ledger entry for stock changes. A product's current quantity is
    derived by summing change_quantity across all of its transactions —
    never stored as a mutable number.
    """

    __tablename__ = "stock_transactions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id"), nullable=False
    )
    change_quantity: Mapped[int] = mapped_column(Integer, nullable=False)  # + in, - out
    reason: Mapped[str] = mapped_column(String, nullable=True)
    actor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
