import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from datetime import date
from typing import Optional

from app.api.deps import get_current_user_id
from app.db.session import get_db
from app.models.pet import Pet
from app.models.health_record import HealthRecord

router = APIRouter()


class HealthRecordCreate(BaseModel):
    record_type: str
    title: str
    description: Optional[str] = None
    record_date: Optional[date] = None
    vet_name: Optional[str] = None
    next_due_date: Optional[date] = None
    notes: Optional[str] = None


class HealthRecordResponse(BaseModel):
    id: uuid.UUID
    pet_id: uuid.UUID
    record_type: str
    title: str
    description: Optional[str]
    record_date: Optional[date]
    vet_name: Optional[str]
    next_due_date: Optional[date]
    notes: Optional[str]

    model_config = {"from_attributes": True}


@router.get("/{pet_id}/health-records", response_model=list[HealthRecordResponse])
async def list_health_records(
    pet_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    await _get_pet_or_404(pet_id, user_id, db)
    stmt = select(HealthRecord).where(HealthRecord.pet_id == pet_id).order_by(HealthRecord.record_date.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/{pet_id}/health-records", response_model=HealthRecordResponse, status_code=201)
async def create_health_record(
    pet_id: uuid.UUID,
    payload: HealthRecordCreate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    await _get_pet_or_404(pet_id, user_id, db)
    record = HealthRecord(pet_id=pet_id, **payload.model_dump())
    db.add(record)
    await db.flush()
    await db.refresh(record)
    return record


@router.delete("/{pet_id}/health-records/{record_id}", status_code=204)
async def delete_health_record(
    pet_id: uuid.UUID,
    record_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    await _get_pet_or_404(pet_id, user_id, db)
    stmt = select(HealthRecord).where(HealthRecord.id == record_id, HealthRecord.pet_id == pet_id)
    result = await db.execute(stmt)
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found.")
    await db.delete(record)


async def _get_pet_or_404(pet_id, user_id, db):
    stmt = select(Pet).where(Pet.id == pet_id, Pet.owner_id == user_id)
    result = await db.execute(stmt)
    pet = result.scalar_one_or_none()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found.")
    return pet
