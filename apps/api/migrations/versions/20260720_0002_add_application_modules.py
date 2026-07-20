"""Add user, data source, API key, permission, and skill modules.

Revision ID: 20260720_0002
Revises: 20260720_0001
Create Date: 2026-07-20
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260720_0002"
down_revision: str | Sequence[str] | None = "20260720_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def timestamp_column(name: str) -> sa.Column[sa.DateTime]:
    return sa.Column(
        name,
        sa.DateTime(timezone=True),
        server_default=sa.text("CURRENT_TIMESTAMP"),
        nullable=False,
    )


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("display_name", sa.String(length=120), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=20), server_default="user", nullable=False),
        sa.Column("status", sa.String(length=20), server_default="active", nullable=False),
        timestamp_column("created_at"),
        timestamp_column("updated_at"),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_tenant_id"), "users", ["tenant_id"])

    op.create_table(
        "auth_sessions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        timestamp_column("created_at"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_auth_sessions_expires_at"), "auth_sessions", ["expires_at"])
    op.create_index(
        op.f("ix_auth_sessions_token_hash"), "auth_sessions", ["token_hash"], unique=True
    )
    op.create_index(op.f("ix_auth_sessions_user_id"), "auth_sessions", ["user_id"])

    op.create_table(
        "data_sources",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("engine", sa.String(length=40), nullable=False),
        sa.Column("host", sa.String(length=255), nullable=True),
        sa.Column("port", sa.Integer(), nullable=True),
        sa.Column("database_name", sa.String(length=120), nullable=True),
        sa.Column("credential_ref", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=20), server_default="draft", nullable=False),
        timestamp_column("created_at"),
        timestamp_column("updated_at"),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "name", name="uq_data_sources_tenant_name"),
    )
    op.create_index(op.f("ix_data_sources_owner_user_id"), "data_sources", ["owner_user_id"])
    op.create_index(op.f("ix_data_sources_tenant_id"), "data_sources", ["tenant_id"])

    op.create_table(
        "api_keys",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("key_prefix", sa.String(length=20), nullable=False),
        sa.Column("key_hash", sa.String(length=64), nullable=False),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
        timestamp_column("created_at"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_api_keys_key_hash"), "api_keys", ["key_hash"], unique=True)
    op.create_index(op.f("ix_api_keys_user_id"), "api_keys", ["user_id"])

    op.create_table(
        "permissions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("data_source_id", sa.Uuid(), nullable=False),
        sa.Column("access_level", sa.String(length=20), server_default="read", nullable=False),
        timestamp_column("created_at"),
        sa.ForeignKeyConstraint(["data_source_id"], ["data_sources.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "data_source_id", name="uq_permissions_user_source"),
    )
    op.create_index(op.f("ix_permissions_data_source_id"), "permissions", ["data_source_id"])
    op.create_index(op.f("ix_permissions_tenant_id"), "permissions", ["tenant_id"])
    op.create_index(op.f("ix_permissions_user_id"), "permissions", ["user_id"])

    op.create_table(
        "skills",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("data_source_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=20), server_default="ready", nullable=False),
        timestamp_column("created_at"),
        timestamp_column("updated_at"),
        sa.ForeignKeyConstraint(["data_source_id"], ["data_sources.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("data_source_id", "name", name="uq_skills_source_name"),
    )
    op.create_index(op.f("ix_skills_data_source_id"), "skills", ["data_source_id"])
    op.create_index(op.f("ix_skills_tenant_id"), "skills", ["tenant_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_skills_tenant_id"), table_name="skills")
    op.drop_index(op.f("ix_skills_data_source_id"), table_name="skills")
    op.drop_table("skills")
    op.drop_index(op.f("ix_permissions_user_id"), table_name="permissions")
    op.drop_index(op.f("ix_permissions_tenant_id"), table_name="permissions")
    op.drop_index(op.f("ix_permissions_data_source_id"), table_name="permissions")
    op.drop_table("permissions")
    op.drop_index(op.f("ix_api_keys_user_id"), table_name="api_keys")
    op.drop_index(op.f("ix_api_keys_key_hash"), table_name="api_keys")
    op.drop_table("api_keys")
    op.drop_index(op.f("ix_data_sources_tenant_id"), table_name="data_sources")
    op.drop_index(op.f("ix_data_sources_owner_user_id"), table_name="data_sources")
    op.drop_table("data_sources")
    op.drop_index(op.f("ix_auth_sessions_user_id"), table_name="auth_sessions")
    op.drop_index(op.f("ix_auth_sessions_token_hash"), table_name="auth_sessions")
    op.drop_index(op.f("ix_auth_sessions_expires_at"), table_name="auth_sessions")
    op.drop_table("auth_sessions")
    op.drop_index(op.f("ix_users_tenant_id"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
