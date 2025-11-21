"""Add user registration fields

Revision ID: 001
Revises: 
Create Date: 2025-11-21

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001_user_registration'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add is_registered column with default False
    op.add_column('user', sa.Column('is_registered', sa.Boolean(), nullable=False, server_default='false'))
    
    # Add registration_completed_at column, nullable
    op.add_column('user', sa.Column('registration_completed_at', sa.DateTime(), nullable=True))
    
    # Mark existing users as registered (they were created before this feature)
    op.execute("UPDATE \"user\" SET is_registered = true, registration_completed_at = created_at WHERE phone IS NOT NULL")


def downgrade() -> None:
    # Remove the added columns
    op.drop_column('user', 'registration_completed_at')
    op.drop_column('user', 'is_registered')
