import enum
import uuid

from sqlalchemy import Enum, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.models.user import User


class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    CANCELLED = "cancelled"


class Subscription(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "subscriptions"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    pet_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pets.id", ondelete="CASCADE"), nullable=False
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("food_products.id"), nullable=False
    )
    status: Mapped[SubscriptionStatus] = mapped_column(
        Enum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE, nullable=False
    )
    # Predicted consumption rate (grams per day) — updated by ML model
    predicted_daily_consumption_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    # Order threshold: trigger new order when stock drops below this (days)
    reorder_threshold_days: Mapped[int] = mapped_column(Integer, default=7, nullable=False)
    current_stock_g: Mapped[float] = mapped_column(Float, nullable=False)
    delivery_address: Mapped[str] = mapped_column(String(500), nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="subscriptions")

    @property
    def days_until_empty(self) -> float | None:
        if self.predicted_daily_consumption_g and self.predicted_daily_consumption_g > 0:
            return self.current_stock_g / self.predicted_daily_consumption_g
        return None
