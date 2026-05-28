import enum
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Date, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.health_record import HealthRecord
    from app.models.weight_log import WeightLog
    from app.models.nutrition_plan import NutritionPlan


class PetSpecies(str, enum.Enum):
    DOG = "dog"
    CAT = "cat"


class PetSex(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"


class ActivityLevel(str, enum.Enum):
    SEDENTARY = "sedentary"
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    VERY_HIGH = "very_high"


class Pet(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "pets"

    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    species: Mapped[PetSpecies] = mapped_column(Enum(PetSpecies), nullable=False)
    breed: Mapped[str | None] = mapped_column(String(100), nullable=True)
    sex: Mapped[PetSex] = mapped_column(Enum(PetSex), nullable=False)
    birth_date: Mapped[str | None] = mapped_column(Date, nullable=True)
    weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    height_cm: Mapped[float | None] = mapped_column(Float, nullable=True)
    activity_level: Mapped[ActivityLevel] = mapped_column(
        Enum(ActivityLevel), default=ActivityLevel.MODERATE, nullable=False
    )
    is_neutered: Mapped[bool] = mapped_column(default=False, nullable=False)
    known_allergies: Mapped[str | None] = mapped_column(Text, nullable=True)  # comma-separated
    medical_conditions: Mapped[str | None] = mapped_column(Text, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    microchip_id: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="pets")
    health_records: Mapped[list["HealthRecord"]] = relationship(
        "HealthRecord", back_populates="pet", cascade="all, delete-orphan"
    )
    weight_logs: Mapped[list["WeightLog"]] = relationship(
        "WeightLog", back_populates="pet", cascade="all, delete-orphan", order_by="WeightLog.logged_at"
    )
    nutrition_plans: Mapped[list["NutritionPlan"]] = relationship(
        "NutritionPlan", back_populates="pet", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Pet {self.name} ({self.species})>"
