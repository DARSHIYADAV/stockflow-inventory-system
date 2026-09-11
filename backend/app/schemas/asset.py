from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.asset import AssetStatus
from app.models.asset_history import AssetHistoryAction


class AssetCreate(BaseModel):
    asset_tag: str
    product_id: UUID
    serial_number: str | None = None
    purchase_date: date | None = None


class AssetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    asset_tag: str
    product_id: UUID
    serial_number: str | None
    status: AssetStatus
    assigned_to: UUID | None
    purchase_date: date | None
    created_at: datetime


class AssetAssign(BaseModel):
    employee_id: UUID
    note: str | None = None


class AssetReturn(BaseModel):
    note: str | None = None


class AssetHistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    asset_id: UUID
    action: AssetHistoryAction
    employee_id: UUID
    actor_id: UUID
    note: str | None
    created_at: datetime
