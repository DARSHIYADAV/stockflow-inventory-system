from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.asset import Asset
from app.models.product import Product
from app.models.user import User
from app.schemas.asset import AssetOut


async def get_asset_or_404(db: AsyncSession, asset_id: UUID) -> Asset:
    asset = await db.get(Asset, asset_id)
    if asset is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    return asset


async def get_product_names(db: AsyncSession, product_ids: list[UUID]) -> dict[UUID, str]:
    if not product_ids:
        return {}
    result = await db.execute(select(Product.id, Product.name).where(Product.id.in_(product_ids)))
    return dict(result.all())


async def get_user_names(db: AsyncSession, user_ids: list[UUID]) -> dict[UUID, str]:
    if not user_ids:
        return {}
    result = await db.execute(select(User.id, User.name).where(User.id.in_(user_ids)))
    return dict(result.all())


def to_asset_out(asset: Asset, product_name: str | None) -> AssetOut:
    return AssetOut(
        id=asset.id,
        asset_tag=asset.asset_tag,
        product_id=asset.product_id,
        product_name=product_name,
        serial_number=asset.serial_number,
        status=asset.status,
        assigned_to=asset.assigned_to,
        purchase_date=asset.purchase_date,
        created_at=asset.created_at,
    )
