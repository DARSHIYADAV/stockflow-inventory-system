from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_admin_or_manager
from app.database import get_db
from app.models.asset import Asset, AssetStatus
from app.models.asset_history import AssetHistory, AssetHistoryAction
from app.models.product import Product
from app.models.user import User, UserRole
from app.schemas.asset import (
    AssetAssign,
    AssetBulkCreate,
    AssetBulkCreateResult,
    AssetCreate,
    AssetHistoryOut,
    AssetOut,
    AssetReturn,
)

router = APIRouter(prefix="/assets", tags=["assets"])


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


def _to_asset_out(asset: Asset, product_name: str | None) -> AssetOut:
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
    return [_to_asset_out(a, product_names.get(a.product_id)) for a in assets]


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
    return [_to_asset_out(a, product_names.get(a.product_id)) for a in assets]


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
    return _to_asset_out(asset, product.name)


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

    created_out = [_to_asset_out(a, product.name) for a in created_assets]
    return AssetBulkCreateResult(created=created_out, skipped_tags=skipped_tags)


@router.get("/{asset_id}/history", response_model=list[AssetHistoryOut])
async def get_asset_history(
    asset_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    asset = await get_asset_or_404(db, asset_id)

    is_manager_or_admin = current_user.role in (UserRole.admin, UserRole.manager)
    is_currently_assigned_to_viewer = asset.assigned_to == current_user.id
    if not is_manager_or_admin and not is_currently_assigned_to_viewer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action",
        )

    result = await db.execute(
        select(AssetHistory).where(AssetHistory.asset_id == asset_id).order_by(AssetHistory.created_at)
    )
    return result.scalars().all()


@router.post("/{asset_id}/assign", response_model=AssetOut)
async def assign_asset(
    asset_id: UUID,
    payload: AssetAssign,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_or_manager),
):
    asset = await get_asset_or_404(db, asset_id)

    if asset.status != AssetStatus.available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot assign asset: current status is '{asset.status.value}', expected 'available'",
        )

    employee = await db.get(User, payload.employee_id)
    if employee is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    asset.status = AssetStatus.assigned
    asset.assigned_to = employee.id

    db.add(
        AssetHistory(
            asset_id=asset.id,
            action=AssetHistoryAction.assigned,
            employee_id=employee.id,
            actor_id=current_user.id,
            note=payload.note,
        )
    )

    await db.commit()
    await db.refresh(asset)
    product = await db.get(Product, asset.product_id)
    return _to_asset_out(asset, product.name if product else None)


@router.post("/{asset_id}/return", response_model=AssetOut)
async def return_asset(
    asset_id: UUID,
    payload: AssetReturn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_or_manager),
):
    asset = await get_asset_or_404(db, asset_id)

    if asset.status != AssetStatus.assigned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot return asset: current status is '{asset.status.value}', expected 'assigned'",
        )

    employee_id = asset.assigned_to
    asset.status = AssetStatus.available
    asset.assigned_to = None

    db.add(
        AssetHistory(
            asset_id=asset.id,
            action=AssetHistoryAction.returned,
            employee_id=employee_id,
            actor_id=current_user.id,
            note=payload.note,
        )
    )

    await db.commit()
    await db.refresh(asset)
    product = await db.get(Product, asset.product_id)
    return _to_asset_out(asset, product.name if product else None)
