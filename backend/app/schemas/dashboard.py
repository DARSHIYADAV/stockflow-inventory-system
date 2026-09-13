from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel


class ActivityItem(BaseModel):
    """
    One entry in the merged recent-activity feed. `type` tells you which
    fields are populated: stock_transaction fields, or asset_history fields.
    """

    type: Literal["stock_transaction", "asset_history"]
    id: UUID
    created_at: datetime
    actor_id: UUID

    # stock_transaction fields
    product_id: UUID | None = None
    change_quantity: int | None = None
    reason: str | None = None
    supplier_name: str | None = None

    # asset_history fields
    asset_id: UUID | None = None
    action: str | None = None
    employee_id: UUID | None = None
    note: str | None = None


class DashboardSummary(BaseModel):
    total_products: int
    low_stock_count: int
    total_assets: int
    assigned_assets_count: int
    recent_activity: list[ActivityItem]
