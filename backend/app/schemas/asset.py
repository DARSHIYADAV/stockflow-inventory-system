from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.asset import AssetStatus
from app.models.asset_history import AssetHistoryAction


class AssetCreate(BaseModel):
    asset_tag: str
    product_id: UUID
    serial_number: str | None = None
    purchase_date: date | None = None

    @field_validator("asset_tag")
    @classmethod
    def strip_asset_tag(cls, value: str) -> str:
        return value.strip()


class AssetBulkCreate(BaseModel):
    product_id: UUID
    tag_prefix: str = Field(..., min_length=1, description="e.g. 'AST-' produces AST-001, AST-002, ...")
    start_number: int = Field(1, ge=0)
    count: int = Field(..., ge=1, le=500)
    pad_width: int = Field(3, ge=1, le=10, description="Zero-padding width for the sequence number")
    purchase_date: date | None = None

    @field_validator("tag_prefix")
    @classmethod
    def strip_tag_prefix(cls, value: str) -> str:
        return value.strip()


class AssetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    asset_tag: str
    product_id: UUID
    product_name: str | None = None
    serial_number: str | None
    status: AssetStatus
    assigned_to: UUID | None
    purchase_date: date | None
    created_at: datetime


class AssetBulkCreateResult(BaseModel):
    created: list[AssetOut]
    skipped_tags: list[str]


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
    employee_name: str | None = None
    actor_id: UUID
    actor_name: str | None = None
    note: str | None
    created_at: datetime
