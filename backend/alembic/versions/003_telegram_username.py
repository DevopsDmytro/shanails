"""Add telegram_username field

Revision ID: 003_telegram_username
Revises: 002_admin_features
Create Date: 2025-11-23

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003_telegram_username'
down_revision = '002_admin_features'
branch_labels = None
depends_on = None


def upgrade():
    # Add telegram_username column to user table
    op.add_column('user', sa.Column('telegram_username', sa.String(), nullable=True))
    
    # Create index for faster username lookups
    op.create_index('ix_user_telegram_username', 'user', ['telegram_username'])


def downgrade():
    # Remove index and column
    op.drop_index('ix_user_telegram_username', table_name='user')
    op.drop_column('user', 'telegram_username')
