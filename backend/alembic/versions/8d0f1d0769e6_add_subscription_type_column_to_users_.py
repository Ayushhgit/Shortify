"""Add subscription_type column to users table

Revision ID: 8d0f1d0769e6
Revises: 9223b3902334
Create Date: 2025-05-24 17:38:10.900573

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8d0f1d0769e6'
down_revision: Union[str, None] = '9223b3902334'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create the enum type first
    subscription_enum = sa.Enum('free', 'pro', 'premium', name='subscription_type')
    subscription_enum.create(op.get_bind(), checkfirst=True)

    # Add the column with a server_default to avoid NULL violations on existing rows
    op.add_column(
        'users',
        sa.Column(
            'subscription_type',
            subscription_enum,
            nullable=False,
            server_default=sa.text("'free'")
        )
    )

    # Optional: Remove the default after it's applied (if you don't want it permanently)
    # op.alter_column('users', 'subscription_type', server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop the column
    op.drop_column('users', 'subscription_type')

    # Drop the enum type
    sa.Enum(name='subscription_type').drop(op.get_bind(), checkfirst=True)
