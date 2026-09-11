from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_admin, require_admin_or_manager
from app.database import get_db
from app.models.asset import Asset
from app.models.product import Product
from app.models.stock_transaction import StockTransaction
from app.models.user import User
from app.schemas.product import ProductCreate, ProductOut, ProductUpdate

router = APIRouter(prefix="/products", tags=["products"])


async def get_product_quantity(db: AsyncSession, product_id: UUID) -> int:
    result = await db.execute(
        select(func.coalesce(func.sum(StockTransaction.change_quantity), 0)).where(
            StockTransaction.product_id == product_id
        )
    )
    return result.scalar_one()


async def get_product_or_404(db: AsyncSession, product_id: UUID) -> Product:
    product = await db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


async def _to_product_out(db: AsyncSession, product: Product) -> ProductOut:
    quantity = await get_product_quantity(db, product.id)
    return ProductOut(
        id=product.id,
        name=product.name,
        category=product.category,
        supplier_name=product.supplier_name,
        low_stock_threshold=product.low_stock_threshold,
        created_at=product.created_at,
        quantity=quantity,
    )


@router.get("", response_model=list[ProductOut])
async def list_products(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Product).order_by(Product.created_at))
    products = result.scalars().all()
    return [await _to_product_out(db, p) for p in products]


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_or_manager),
):
    product = Product(**payload.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return await _to_product_out(db, product)


@router.put("/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: UUID,
    payload: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_or_manager),
):
    product = await get_product_or_404(db, product_id)
    for field, value in payload.model_dump().items():
        setattr(product, field, value)
    await db.commit()
    await db.refresh(product)
    return await _to_product_out(db, product)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    product = await get_product_or_404(db, product_id)

    has_transactions = await db.scalar(
        select(StockTransaction.id).where(StockTransaction.product_id == product_id).limit(1)
    )
    has_assets = await db.scalar(select(Asset.id).where(Asset.product_id == product_id).limit(1))
    if has_transactions is not None or has_assets is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete a product with existing stock transactions or assets",
        )

    await db.delete(product)
    await db.commit()
