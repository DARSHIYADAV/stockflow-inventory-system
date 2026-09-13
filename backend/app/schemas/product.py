from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ProductCreate(BaseModel):
    name: str
    category: str
    supplier_name: str | None = None
    low_stock_threshold: int = 0


class ProductUpdate(BaseModel):
    name: str
    category: str
    supplier_name: str | None = None
    low_stock_threshold: int = 0


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    category: str
    supplier_name: str | None
    latest_supplier_name: str | None = None
    low_stock_threshold: int
    created_at: datetime
    quantity: int


class ProductLite(BaseModel):
    """Minimal product info for admin/manager to pick a product when
    creating an asset — without granting full Products page access."""

    id: UUID
    name: str


class StockTransactionCreate(BaseModel):
    change_quantity: int = Field(..., description="Positive = stock in, negative = stock out")
    reason: str | None = None
    supplier_name: str | None = None


class StockTransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_id: UUID
    change_quantity: int
    reason: str | None
    supplier_name: str | None
    actor_id: UUID
    created_at: datetime
