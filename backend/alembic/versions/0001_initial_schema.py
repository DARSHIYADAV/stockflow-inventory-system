"""initial schema: users, products, stock_transactions, assets, asset_history

Revision ID: 0001
Revises:
Create Date: 2026-09-11
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    user_role = postgresql.ENUM("admin", "manager", "employee", name="user_role", create_type=False)
    asset_status = postgresql.ENUM("available", "assigned", "retired", name="asset_status", create_type=False)
    asset_history_action = postgresql.ENUM("assigned", "returned", name="asset_history_action", create_type=False)

    user_role.create(op.get_bind(), checkfirst=True)
    asset_status.create(op.get_bind(), checkfirst=True)
    asset_history_action.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("email", sa.String, nullable=False),
        sa.Column("password_hash", sa.String, nullable=False),
        sa.Column("role", user_role, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("email"),
    )

    op.create_table(
        "products",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("category", sa.String, nullable=False),
        sa.Column("supplier_name", sa.String, nullable=True),
        sa.Column("low_stock_threshold", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "stock_transactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("change_quantity", sa.Integer, nullable=False),
        sa.Column("reason", sa.String, nullable=True),
        sa.Column("actor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "assets",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("asset_tag", sa.String, nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("serial_number", sa.String, nullable=True),
        sa.Column("status", asset_status, nullable=False),
        sa.Column("assigned_to", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("purchase_date", sa.Date, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("asset_tag"),
    )

    op.create_table(
        "asset_history",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("asset_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("assets.id"), nullable=False),
        sa.Column("action", asset_history_action, nullable=False),
        sa.Column("employee_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("actor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("note", sa.String, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("asset_history")
    op.drop_table("assets")
    op.drop_table("stock_transactions")
    op.drop_table("products")
    op.drop_table("users")

    postgresql.ENUM(name="asset_history_action").drop(op.get_bind(), checkfirst=True)
    postgresql.ENUM(name="asset_status").drop(op.get_bind(), checkfirst=True)
    postgresql.ENUM(name="user_role").drop(op.get_bind(), checkfirst=True)
