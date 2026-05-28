import uuid
from datetime import date

from sqlalchemy import Boolean, Date, Float, ForeignKey, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.models.pet import Pet
    from app.models.food_product import FoodProduct


class NutritionPlan(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "nutrition_plans"

    pet_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pets.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    daily_calories_kcal: Mapped[float] = mapped_column(Float, nullable=False)
    daily_protein_g: Mapped[float] = mapped_column(Float, nullable=False)
    daily_fat_g: Mapped[float] = mapped_column(Float, nullable=False)
    daily_carbs_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    feeding_frequency: Mapped[int] = mapped_column(default=2, nullable=False)  # meals/day
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    valid_from: Mapped[date] = mapped_column(Date, nullable=False)
    valid_until: Mapped[date | None] = mapped_column(Date, nullable=True)
    # JSON field: {product_id: portion_g, ...}
    product_portions: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    pet: Mapped["Pet"] = relationship("Pet", back_populates="nutrition_plans")
