from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_admin_or_manager
from app.database import get_db
from app.models.asset import Asset, AssetStatus
from app.models.product import Product
from app.models.user import User
from app.schemas.asset import (
    AssetBulkCreate,
    AssetBulkCreateResult,
    AssetCreate,
    AssetOut,
)
from app.services.assets import get_product_names, to_asset_out

router = APIRouter(prefix="/assets", tags=["assets"])


@router.get("", response_model=list[AssetOut])
async def list_assets(
    status_filter: AssetStatus | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_or_manager),
):
    query = select(Asset)
    if status_filter is not None:
        query = query.where(Asset.status == status_filter)
    result = await db.execute(query.order_by(Asset.created_at))
    assets = result.scalars().all()

    product_names = await get_product_names(db, [a.product_id for a in assets])
    return [to_asset_out(a, product_names.get(a.product_id)) for a in assets]


@router.get("/my", response_model=list[AssetOut])
async def list_my_assets(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Asset).where(Asset.assigned_to == current_user.id).order_by(Asset.created_at)
    )
    assets = result.scalars().all()

    product_names = await get_product_names(db, [a.product_id for a in assets])
    return [to_asset_out(a, product_names.get(a.product_id)) for a in assets]


@router.post("", response_model=AssetOut, status_code=status.HTTP_201_CREATED)
async def create_asset(
    payload: AssetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_or_manager),
):
    existing = await db.scalar(select(Asset).where(Asset.asset_tag == payload.asset_tag))
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Asset tag already exists")

    product = await db.get(Product, payload.product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    asset = Asset(**payload.model_dump())
    db.add(asset)
    await db.commit()
    await db.refresh(asset)
    return to_asset_out(asset, product.name)


@router.post("/bulk", response_model=AssetBulkCreateResult, status_code=status.HTTP_201_CREATED)
async def bulk_create_assets(
    payload: AssetBulkCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_or_manager),
):
    product = await db.get(Product, payload.product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    candidate_tags = [
        f"{payload.tag_prefix}{str(n).zfill(payload.pad_width)}"
        for n in range(payload.start_number, payload.start_number + payload.count)
    ]

    result = await db.execute(select(Asset.asset_tag).where(Asset.asset_tag.in_(candidate_tags)))
    existing_tags = set(result.scalars().all())

    created_assets = []
    skipped_tags = []
    for tag in candidate_tags:
        if tag in existing_tags:
            skipped_tags.append(tag)
            continue
        asset = Asset(
            asset_tag=tag,
            product_id=payload.product_id,
            purchase_date=payload.purchase_date,
        )
        db.add(asset)
        created_assets.append(asset)

    await db.commit()
    for asset in created_assets:
        await db.refresh(asset)

    created_out = [to_asset_out(a, product.name) for a in created_assets]
    return AssetBulkCreateResult(created=created_out, skipped_tags=skipped_tags)
