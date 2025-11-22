"""Add admin panel features

Revision ID: 002_admin_features
Revises: 001_user_registration
Create Date: 2025-11-22

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002_admin_features'
down_revision = '001_user_registration'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # User table: Add cancellation and change tracking
    op.add_column('user', sa.Column('cancellations_this_year', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('user', sa.Column('last_cancellation_reset', sa.DateTime(), nullable=True))
    op.add_column('user', sa.Column('last_time_slot_change', sa.DateTime(), nullable=True))
    op.add_column('user', sa.Column('notes', sa.String(), nullable=True))
    
    # Service table: Add description, image, and popular flag
    op.add_column('service', sa.Column('description', sa.String(), nullable=True))
    op.add_column('service', sa.Column('image_url', sa.String(), nullable=True))
    op.add_column('service', sa.Column('is_popular', sa.Boolean(), nullable=False, server_default='false'))
    
    # Schedule table: Add break flag and note
    op.add_column('schedule', sa.Column('is_break', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('schedule', sa.Column('note', sa.String(), nullable=True))


def downgrade() -> None:
    # Remove schedule columns
    op.drop_column('schedule', 'note')
    op.drop_column('schedule', 'is_break')
    
    # Remove service columns
    op.drop_column('service', 'is_popular')
    op.drop_column('service', 'image_url')
    op.drop_column('service', 'description')
    
    # Remove user columns
    op.drop_column('user', 'notes')
    op.drop_column('user', 'last_time_slot_change')
    op.drop_column('user', 'last_cancellation_reset')
    op.drop_column('user', 'cancellations_this_year')
