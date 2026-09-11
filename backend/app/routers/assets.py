from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_admin_or_manager
from app.database import get_db
from app.models.asset import Asset, AssetStatus
from app.models.asset_history import AssetHistory, AssetHistoryAction
from app.models.user import User
from app.schemas.asset import AssetAssign, AssetCreate, AssetHistoryOut, AssetOut, AssetReturn

router = APIRouter(prefix="/assets", tags=["assets"])


async def get_asset_or_404(db: AsyncSession, asset_id: UUID) -> Asset:
    asset = await db.get(Asset, asset_id)
    if asset is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    return asset


@router.get("", response_model=list[AssetOut])
async def list_assets(
    status_filter: AssetStatus | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Asset)
    if status_filter is not None:
        query = query.where(Asset.status == status_filter)
    result = await db.execute(query.order_by(Asset.created_at))
    return result.scalars().all()


@router.get("/my", response_model=list[AssetOut])
async def list_my_assets(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Asset).where(Asset.assigned_to == current_user.id).order_by(Asset.created_at)
    )
    return result.scalars().all()


@router.post("", response_model=AssetOut, status_code=status.HTTP_201_CREATED)
async def create_asset(
    payload: AssetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_or_manager),
):
    existing = await db.scalar(select(Asset).where(Asset.asset_tag == payload.asset_tag))
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Asset tag already exists")

    asset = Asset(**payload.model_dump())
    db.add(asset)
    await db.commit()
    await db.refresh(asset)
    return asset


@router.get("/{asset_id}/history", response_model=list[AssetHistoryOut])
async def get_asset_history(
    asset_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await get_asset_or_404(db, asset_id)
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
    return asset


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
    return asset
