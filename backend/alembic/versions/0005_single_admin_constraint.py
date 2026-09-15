"""enforce at most one admin user at the database level

Revision ID: 0005
Revises: 0003
Create Date: 2026-09-15
"""

from alembic import op

revision = "0005"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "CREATE UNIQUE INDEX one_admin_only ON users ((role)) WHERE role = 'admin'"
    )


def downgrade() -> None:
    op.execute("DROP INDEX one_admin_only")
