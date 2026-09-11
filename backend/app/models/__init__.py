"""
Import all models here so Alembic's autogenerate can discover them
through `Base.metadata` in one place.
"""

from app.models.user import User
from app.models.product import Product
from app.models.stock_transaction import StockTransaction
from app.models.asset import Asset
from app.models.asset_history import AssetHistory

__all__ = [
    "User",
    "Product",
    "StockTransaction",
    "Asset",
    "AssetHistory",
]
