import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.pet import Pet
from app.models.weight_log import WeightLog
from app.schemas.pet import PetCreate, PetUpdate, PetResponse, WeightLogCreate, WeightLogResponse

router = APIRouter()


@router.get("/", response_model=list[PetResponse])
async def list_pets(
    user_id: uuid.UUID,  # In production: comes from JWT dependency
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Pet).where(Pet.owner_id == user_id)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/", response_model=PetResponse, status_code=status.HTTP_201_CREATED)
async def create_pet(
    payload: PetCreate,
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    pet = Pet(**payload.model_dump(), owner_id=user_id)
    db.add(pet)
    await db.flush()
    await db.refresh(pet)
    return pet


@router.get("/{pet_id}", response_model=PetResponse)
async def get_pet(
    pet_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    pet = await _get_pet_or_404(pet_id, user_id, db)
    return pet


@router.patch("/{pet_id}", response_model=PetResponse)
async def update_pet(
    pet_id: uuid.UUID,
    payload: PetUpdate,
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    pet = await _get_pet_or_404(pet_id, user_id, db)
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(pet, field, value)
    await db.flush()
    await db.refresh(pet)
    return pet


@router.delete("/{pet_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pet(
    pet_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    pet = await _get_pet_or_404(pet_id, user_id, db)
    await db.delete(pet)


# ─── Weight Logs ──────────────────────────────────────────

@router.post("/{pet_id}/weight-logs", response_model=WeightLogResponse, status_code=status.HTTP_201_CREATED)
async def log_weight(
    pet_id: uuid.UUID,
    payload: WeightLogCreate,
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    await _get_pet_or_404(pet_id, user_id, db)
    log = WeightLog(pet_id=pet_id, **payload.model_dump())
    db.add(log)
    await db.flush()
    await db.refresh(log)
    return log


@router.get("/{pet_id}/weight-logs", response_model=list[WeightLogResponse])
async def get_weight_logs(
    pet_id: uuid.UUID,
    user_id: uuid.UUID,
    limit: int = 90,
    db: AsyncSession = Depends(get_db),
):
    await _get_pet_or_404(pet_id, user_id, db)
    stmt = (
        select(WeightLog)
        .where(WeightLog.pet_id == pet_id)
        .order_by(WeightLog.logged_at.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


async def _get_pet_or_404(
    pet_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession
) -> Pet:
    stmt = select(Pet).where(Pet.id == pet_id, Pet.owner_id == user_id)
    result = await db.execute(stmt)
    pet = result.scalar_one_or_none()
    if not pet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pet not found.")
    return pet
