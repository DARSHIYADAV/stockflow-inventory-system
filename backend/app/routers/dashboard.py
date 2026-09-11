import heapq

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_admin_or_manager
from app.database import get_db
from app.models.asset import Asset, AssetStatus
from app.models.asset_history import AssetHistory
from app.models.product import Product
from app.models.stock_transaction import StockTransaction
from app.models.user import User
from app.schemas.dashboard import ActivityItem, DashboardSummary

RECENT_ACTIVITY_LIMIT = 10

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_or_manager),
):
    total_products = await db.scalar(select(func.count()).select_from(Product))

    quantity_per_product = select(
        Product.id,
        Product.low_stock_threshold,
        func.coalesce(func.sum(StockTransaction.change_quantity), 0).label("quantity"),
    ).select_from(Product).join(
        StockTransaction, StockTransaction.product_id == Product.id, isouter=True
    ).group_by(Product.id, Product.low_stock_threshold)

    result = await db.execute(quantity_per_product)
    low_stock_count = sum(
        1 for _, threshold, quantity in result.all() if quantity <= threshold
    )

    total_assets = await db.scalar(select(func.count()).select_from(Asset))
    assigned_assets_count = await db.scalar(
        select(func.count()).select_from(Asset).where(Asset.status == AssetStatus.assigned)
    )

    recent_transactions = (
        await db.execute(
            select(StockTransaction).order_by(StockTransaction.created_at.desc()).limit(RECENT_ACTIVITY_LIMIT)
        )
    ).scalars().all()
    recent_asset_history = (
        await db.execute(
            select(AssetHistory).order_by(AssetHistory.created_at.desc()).limit(RECENT_ACTIVITY_LIMIT)
        )
    ).scalars().all()

    activity_items = [
        ActivityItem(
            type="stock_transaction",
            id=t.id,
            created_at=t.created_at,
            actor_id=t.actor_id,
            product_id=t.product_id,
            change_quantity=t.change_quantity,
            reason=t.reason,
        )
        for t in recent_transactions
    ] + [
        ActivityItem(
            type="asset_history",
            id=h.id,
            created_at=h.created_at,
            actor_id=h.actor_id,
            asset_id=h.asset_id,
            action=h.action.value,
            employee_id=h.employee_id,
            note=h.note,
        )
        for h in recent_asset_history
    ]

    recent_activity = heapq.nlargest(RECENT_ACTIVITY_LIMIT, activity_items, key=lambda item: item.created_at)

    return DashboardSummary(
        total_products=total_products,
        low_stock_count=low_stock_count,
        total_assets=total_assets,
        assigned_assets_count=assigned_assets_count,
        recent_activity=recent_activity,
    )
