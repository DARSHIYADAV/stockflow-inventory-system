from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_admin_or_manager
from app.database import get_db
from app.models.stock_transaction import StockTransaction
from app.models.user import User
from app.routers.products import get_product_or_404, get_product_quantity
from app.schemas.product import StockTransactionCreate, StockTransactionOut

router = APIRouter(prefix="/stock", tags=["stock"])


@router.post(
    "/{product_id}/transaction",
    response_model=StockTransactionOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_stock_transaction(
    product_id: UUID,
    payload: StockTransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_or_manager),
):
    await get_product_or_404(db, product_id)

    if payload.change_quantity == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="change_quantity cannot be zero",
        )

    current_quantity = await get_product_quantity(db, product_id)
    resulting_quantity = current_quantity + payload.change_quantity
    if resulting_quantity < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Stock-out rejected: current quantity is {current_quantity}, "
                f"this transaction would bring it to {resulting_quantity}"
            ),
        )

    transaction = StockTransaction(
        product_id=product_id,
        change_quantity=payload.change_quantity,
        reason=payload.reason,
        actor_id=current_user.id,
    )
    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)
    return transaction


@router.get("/{product_id}/history", response_model=list[StockTransactionOut])
async def get_stock_history(
    product_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await get_product_or_404(db, product_id)
    result = await db.execute(
        select(StockTransaction)
        .where(StockTransaction.product_id == product_id)
        .order_by(StockTransaction.created_at)
    )
    return result.scalars().all()
