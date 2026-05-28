import enum
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Date, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.pet import Pet


class RecordType(str, enum.Enum):
    VACCINATION = "vaccination"
    VET_VISIT = "vet_visit"
    MEDICATION = "medication"
    SURGERY = "surgery"
    LAB_TEST = "lab_test"
    OTHER = "other"


class HealthRecord(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "health_records"

    pet_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pets.id", ondelete="CASCADE"), nullable=False, index=True
    )
    record_type: Mapped[RecordType] = mapped_column(Enum(RecordType), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    record_date: Mapped[str | None] = mapped_column(Date, nullable=True)
    vet_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    next_due_date: Mapped[str | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    pet: Mapped["Pet"] = relationship("Pet", back_populates="health_records")

    def __repr__(self) -> str:
        return f"<HealthRecord {self.title} ({self.record_type})>"
