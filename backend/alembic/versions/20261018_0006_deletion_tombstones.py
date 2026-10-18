"""Health Bridge: durable deletion tombstones."""
from alembic import op
import sqlalchemy as sa
revision = "20261018_0006"
down_revision = "20260729_0005"
branch_labels = None
depends_on = None

def upgrade():
    op.create_table("deletion_tombstones",
        sa.Column("workspace_id", sa.String(64), primary_key=True),
        sa.Column("device_id", sa.String(128), primary_key=True),
        sa.Column("kind", sa.String(16), primary_key=True),
        sa.Column("id", sa.String(256), primary_key=True))

def downgrade():
    op.drop_table("deletion_tombstones")
