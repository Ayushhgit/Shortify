"""Merge heads after branching

Revision ID: c10a76b8d77f
Revises: 512858878bc3, c3780c5899be
Create Date: 2025-06-08 04:43:47.089516

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c10a76b8d77f'
down_revision: Union[str, None] = ('512858878bc3', 'c3780c5899be')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
