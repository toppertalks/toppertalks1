"""add toppertalks domain models

Revision ID: 0002_domain_models
Revises: 0001_init_auth
Create Date: 2026-05-30 00:00:00

"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002_domain_models"
down_revision: Union[str, None] = "0001_init_auth"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ---- Extend users with TopperTalks profile fields --------------------
    op.add_column(
        "users",
        sa.Column("role", sa.String(length=32), nullable=False, server_default="student"),
    )
    op.add_column(
        "users",
        sa.Column("exam_mode", sa.String(length=16), nullable=False, server_default="JEE"),
    )
    op.add_column(
        "users",
        sa.Column("avatar_url", sa.String(length=512), nullable=True),
    )

    # ---- toppers ---------------------------------------------------------
    op.create_table(
        "toppers",
        sa.Column("uid", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("college", sa.String(length=255), nullable=True),
        sa.Column("branch", sa.String(length=255), nullable=True),
        sa.Column("year", sa.String(length=32), nullable=True),
        sa.Column("rank", sa.String(length=64), nullable=True),
        sa.Column("exam_cleared", sa.String(length=64), nullable=True),
        sa.Column("subjects", postgresql.ARRAY(sa.String()), nullable=False, server_default="{}"),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("rating", sa.Float(), nullable=False, server_default="0"),
        sa.Column("total_sessions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_online", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("avatar_url", sa.String(length=512), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["uid"], ["users.id"], name=op.f("fk_toppers_uid_users"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("uid", name=op.f("pk_toppers")),
    )
    op.create_index(op.f("ix_toppers_exam_cleared"), "toppers", ["exam_cleared"], unique=False)

    # ---- call_sessions ---------------------------------------------------
    op.create_table(
        "call_sessions",
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("student_uid", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("topper_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("topper_name", sa.String(length=255), nullable=True),
        sa.Column("start_time", sa.Float(), nullable=False),
        sa.Column("end_time", sa.Float(), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("amount_charged", sa.Float(), nullable=False, server_default="0"),
        sa.Column("student_pays", sa.Float(), nullable=False, server_default="0"),
        sa.Column("topper_earns", sa.Float(), nullable=False, server_default="0"),
        sa.Column("platform_fee", sa.Float(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="active"),
        sa.Column("report_reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["student_uid"], ["users.id"], name=op.f("fk_call_sessions_student_uid_users"), ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["topper_id"], ["users.id"], name=op.f("fk_call_sessions_topper_id_users"), ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("session_id", name=op.f("pk_call_sessions")),
    )
    op.create_index(op.f("ix_call_sessions_student_uid"), "call_sessions", ["student_uid"], unique=False)
    op.create_index(op.f("ix_call_sessions_topper_id"), "call_sessions", ["topper_id"], unique=False)
    op.create_index(op.f("ix_call_sessions_status"), "call_sessions", ["status"], unique=False)

    # ---- wallets ---------------------------------------------------------
    op.create_table(
        "wallets",
        sa.Column("uid", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("balance", sa.Float(), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(["uid"], ["users.id"], name=op.f("fk_wallets_uid_users"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("uid", name=op.f("pk_wallets")),
    )

    # ---- transactions ----------------------------------------------------
    op.create_table(
        "transactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_uid", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("type", sa.String(length=32), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("payment_id", sa.String(length=128), nullable=True),
        sa.Column("description", sa.String(length=512), nullable=True),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_uid"], ["wallets.uid"], name=op.f("fk_transactions_user_uid_wallets"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_transactions")),
    )
    op.create_index(op.f("ix_transactions_user_uid"), "transactions", ["user_uid"], unique=False)
    op.create_index(op.f("ix_transactions_payment_id"), "transactions", ["payment_id"], unique=False)

    # ---- ratings ---------------------------------------------------------
    op.create_table(
        "ratings",
        sa.Column("rating_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("from_uid", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("to_uid", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("stars", sa.Integer(), nullable=False),
        sa.Column("comment", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["call_sessions.session_id"], name=op.f("fk_ratings_session_id_call_sessions"), ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["from_uid"], ["users.id"], name=op.f("fk_ratings_from_uid_users"), ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["to_uid"], ["users.id"], name=op.f("fk_ratings_to_uid_users"), ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("rating_id", name=op.f("pk_ratings")),
        sa.UniqueConstraint("session_id", "from_uid", name="uq_ratings_session_from"),
    )
    op.create_index(op.f("ix_ratings_session_id"), "ratings", ["session_id"], unique=False)
    op.create_index(op.f("ix_ratings_from_uid"), "ratings", ["from_uid"], unique=False)
    op.create_index(op.f("ix_ratings_to_uid"), "ratings", ["to_uid"], unique=False)

    # ---- mentor_applications --------------------------------------------
    op.create_table(
        "mentor_applications",
        sa.Column("applicant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=32), nullable=False),
        sa.Column("college", sa.String(length=255), nullable=False),
        sa.Column("branch", sa.String(length=255), nullable=True),
        sa.Column("year", sa.String(length=32), nullable=True),
        sa.Column("exams", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="[]"),
        sa.Column("subjects", postgresql.ARRAY(sa.String()), nullable=False, server_default="{}"),
        sa.Column("bio", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="pending"),
        sa.Column("applied_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["applicant_id"], ["users.id"], name=op.f("fk_mentor_applications_applicant_id_users"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("applicant_id", name=op.f("pk_mentor_applications")),
    )

    # ---- events ----------------------------------------------------------
    op.create_table(
        "events",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("event", sa.String(length=128), nullable=False),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("client_timestamp", sa.String(length=64), nullable=True),
        sa.Column("server_timestamp", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_events_user_id_users"), ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_events")),
    )
    op.create_index(op.f("ix_events_user_id"), "events", ["user_id"], unique=False)
    op.create_index(op.f("ix_events_event"), "events", ["event"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_events_event"), table_name="events")
    op.drop_index(op.f("ix_events_user_id"), table_name="events")
    op.drop_table("events")

    op.drop_table("mentor_applications")

    op.drop_index(op.f("ix_ratings_to_uid"), table_name="ratings")
    op.drop_index(op.f("ix_ratings_from_uid"), table_name="ratings")
    op.drop_index(op.f("ix_ratings_session_id"), table_name="ratings")
    op.drop_table("ratings")

    op.drop_index(op.f("ix_transactions_payment_id"), table_name="transactions")
    op.drop_index(op.f("ix_transactions_user_uid"), table_name="transactions")
    op.drop_table("transactions")

    op.drop_table("wallets")

    op.drop_index(op.f("ix_call_sessions_status"), table_name="call_sessions")
    op.drop_index(op.f("ix_call_sessions_topper_id"), table_name="call_sessions")
    op.drop_index(op.f("ix_call_sessions_student_uid"), table_name="call_sessions")
    op.drop_table("call_sessions")

    op.drop_index(op.f("ix_toppers_exam_cleared"), table_name="toppers")
    op.drop_table("toppers")

    op.drop_column("users", "avatar_url")
    op.drop_column("users", "exam_mode")
    op.drop_column("users", "role")
