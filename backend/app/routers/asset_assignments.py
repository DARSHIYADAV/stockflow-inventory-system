from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_admin_or_manager
from app.database import get_db
from app.models.asset import AssetStatus
from app.models.asset_history import AssetHistory, AssetHistoryAction
from app.models.product import Product
from app.models.user import User, UserRole
from app.schemas.asset import (
    AssetAssign,
    AssetHistoryOut,
    AssetOut,
    AssetReturn,
)
from app.services.assets import get_asset_or_404, get_user_names, to_asset_out

router = APIRouter(prefix="/assets", tags=["assets"])


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
    history = result.scalars().all()

    user_ids = {h.employee_id for h in history} | {h.actor_id for h in history}
    user_names = await get_user_names(db, list(user_ids))

    return [
        AssetHistoryOut(
            id=h.id,
            asset_id=h.asset_id,
            action=h.action,
            employee_id=h.employee_id,
            employee_name=user_names.get(h.employee_id),
            actor_id=h.actor_id,
            actor_name=user_names.get(h.actor_id),
            note=h.note,
            created_at=h.created_at,
        )
        for h in history
    ]


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
    return to_asset_out(asset, product.name if product else None)


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
    return to_asset_out(asset, product.name if product else None)
