"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2024-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ─── users ────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("is_veterinarian", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("avatar_url", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # ─── pets ─────────────────────────────────────────────
    op.create_table(
        "pets",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("species", sa.String(10), nullable=False),
        sa.Column("breed", sa.String(100), nullable=True),
        sa.Column("sex", sa.String(10), nullable=False),
        sa.Column("birth_date", sa.Date(), nullable=True),
        sa.Column("weight_kg", sa.Float(), nullable=False),
        sa.Column("height_cm", sa.Float(), nullable=True),
        sa.Column("activity_level", sa.String(20), nullable=False, server_default="moderate"),
        sa.Column("is_neutered", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("known_allergies", sa.Text(), nullable=True),
        sa.Column("medical_conditions", sa.Text(), nullable=True),
        sa.Column("avatar_url", sa.String(500), nullable=True),
        sa.Column("microchip_id", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_pets_owner_id", "pets", ["owner_id"])

    # ─── weight_logs ──────────────────────────────────────
    op.create_table(
        "weight_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("pet_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("pets.id", ondelete="CASCADE"), nullable=False),
        sa.Column("weight_kg", sa.Float(), nullable=False),
        sa.Column("calorie_intake", sa.Float(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("logged_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_weight_logs_pet_id", "weight_logs", ["pet_id"])
    op.create_index("ix_weight_logs_logged_at", "weight_logs", ["logged_at"])

    # ─── food_products ────────────────────────────────────
    op.create_table(
        "food_products",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("name", sa.String(300), nullable=False),
        sa.Column("brand", sa.String(150), nullable=False),
        sa.Column("barcode", sa.String(50), nullable=True),
        sa.Column("qr_code", sa.String(100), nullable=True),
        sa.Column("species", sa.String(10), nullable=False),
        sa.Column("calories_kcal", sa.Float(), nullable=False),
        sa.Column("protein_g", sa.Float(), nullable=False),
        sa.Column("fat_g", sa.Float(), nullable=False),
        sa.Column("carbs_g", sa.Float(), nullable=True),
        sa.Column("fiber_g", sa.Float(), nullable=True),
        sa.Column("moisture_percent", sa.Float(), nullable=True),
        sa.Column("calcium_mg", sa.Float(), nullable=True),
        sa.Column("phosphorus_mg", sa.Float(), nullable=True),
        sa.Column("omega3_mg", sa.Float(), nullable=True),
        sa.Column("ingredients", sa.Text(), nullable=True),
        sa.Column("allergens", sa.String(500), nullable=True),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("is_authentic", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("manufacturer_id", sa.String(100), nullable=True),
        sa.Column("image_url", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_food_products_barcode", "food_products", ["barcode"], unique=True)
    op.create_index("ix_food_products_name", "food_products", ["name"])

    # ─── nutrition_plans ──────────────────────────────────
    op.create_table(
        "nutrition_plans",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("pet_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("pets.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("daily_calories_kcal", sa.Float(), nullable=False),
        sa.Column("daily_protein_g", sa.Float(), nullable=False),
        sa.Column("daily_fat_g", sa.Float(), nullable=False),
        sa.Column("daily_carbs_g", sa.Float(), nullable=True),
        sa.Column("feeding_frequency", sa.Integer(), nullable=False, server_default="2"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("valid_from", sa.Date(), nullable=False),
        sa.Column("valid_until", sa.Date(), nullable=True),
        sa.Column("product_portions", postgresql.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_nutrition_plans_pet_id", "nutrition_plans", ["pet_id"])

    # ─── subscriptions ────────────────────────────────────
    op.create_table(
        "subscriptions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("pet_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("pets.id", ondelete="CASCADE"), nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("food_products.id"), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.Column("predicted_daily_consumption_g", sa.Float(), nullable=True),
        sa.Column("reorder_threshold_days", sa.Integer(), nullable=False, server_default="7"),
        sa.Column("current_stock_g", sa.Float(), nullable=False),
        sa.Column("delivery_address", sa.String(500), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_subscriptions_user_id", "subscriptions", ["user_id"])


def downgrade() -> None:
    op.drop_table("subscriptions")
    op.drop_table("nutrition_plans")
    op.drop_table("food_products")
    op.drop_table("weight_logs")
    op.drop_table("pets")
    op.drop_table("users")
