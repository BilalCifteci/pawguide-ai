import enum

from sqlalchemy import Boolean, Enum, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDMixin


class ProductSpecies(str, enum.Enum):
    DOG = "dog"
    CAT = "cat"
    BOTH = "both"


class FoodProduct(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "food_products"

    name: Mapped[str] = mapped_column(String(300), nullable=False, index=True)
    brand: Mapped[str] = mapped_column(String(150), nullable=False)
    barcode: Mapped[str | None] = mapped_column(String(50), unique=True, index=True, nullable=True)
    qr_code: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    species: Mapped[ProductSpecies] = mapped_column(Enum(ProductSpecies), nullable=False)

    # Nutritional info (per 100g)
    calories_kcal: Mapped[float] = mapped_column(Float, nullable=False)
    protein_g: Mapped[float] = mapped_column(Float, nullable=False)
    fat_g: Mapped[float] = mapped_column(Float, nullable=False)
    carbs_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    fiber_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    moisture_percent: Mapped[float | None] = mapped_column(Float, nullable=True)
    # Key micronutrients
    calcium_mg: Mapped[float | None] = mapped_column(Float, nullable=True)
    phosphorus_mg: Mapped[float | None] = mapped_column(Float, nullable=True)
    omega3_mg: Mapped[float | None] = mapped_column(Float, nullable=True)

    ingredients: Mapped[str | None] = mapped_column(Text, nullable=True)
    allergens: Mapped[str | None] = mapped_column(String(500), nullable=True)  # comma-separated
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_authentic: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    manufacturer_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    def __repr__(self) -> str:
        return f"<FoodProduct {self.brand} – {self.name}>"
