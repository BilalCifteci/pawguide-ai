import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.pet import Pet
from app.models.food_product import FoodProduct
from app.models.nutrition_plan import NutritionPlan
from app.ml.nutrition_engine import (
    calculate_nutrition_requirements,
    score_food_product,
)
from app.schemas.nutrition import (
    NutritionPlanResponse,
    NutritionRequirementsResponse,
    FoodScoringRequest,
    FoodScoringResponse,
)

router = APIRouter()


@router.get("/requirements/{pet_id}", response_model=NutritionRequirementsResponse)
async def get_nutrition_requirements(
    pet_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Calculate FEDIAF-compliant daily nutritional requirements for a pet."""
    pet = await _get_pet_or_404(pet_id, user_id, db)

    age_years = None
    if pet.birth_date:
        from datetime import date
        delta = date.today() - pet.birth_date
        age_years = delta.days / 365.25

    requirements = calculate_nutrition_requirements(
        weight_kg=pet.weight_kg,
        species=pet.species.value,
        activity_level=pet.activity_level.value,
        is_neutered=pet.is_neutered,
        age_years=age_years,
        known_allergies=pet.known_allergies.split(",") if pet.known_allergies else [],
    )

    return NutritionRequirementsResponse(**requirements.__dict__, pet_id=pet_id)


@router.post("/score-food", response_model=FoodScoringResponse)
async def score_food(
    payload: FoodScoringRequest,
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Score a food product against a pet's nutritional requirements."""
    pet = await _get_pet_or_404(payload.pet_id, user_id, db)

    stmt = select(FoodProduct).where(FoodProduct.id == payload.product_id)
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Food product not found.")

    requirements = calculate_nutrition_requirements(
        weight_kg=pet.weight_kg,
        species=pet.species.value,
        activity_level=pet.activity_level.value,
        is_neutered=pet.is_neutered,
    )

    product_dict = {
        "calories_kcal": product.calories_kcal,
        "protein_g": product.protein_g,
        "fat_g": product.fat_g,
        "allergens": product.allergens or "",
    }

    allergies = pet.known_allergies.split(",") if pet.known_allergies else []
    score_result = score_food_product(
        product=product_dict,
        requirements=requirements,
        daily_portion_g=payload.daily_portion_g,
        allergies=allergies,
    )

    return FoodScoringResponse(
        product_id=payload.product_id,
        pet_id=payload.pet_id,
        **score_result,
    )


@router.get("/plans/{pet_id}", response_model=list[NutritionPlanResponse])
async def get_nutrition_plans(
    pet_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    await _get_pet_or_404(pet_id, user_id, db)
    stmt = (
        select(NutritionPlan)
        .where(NutritionPlan.pet_id == pet_id)
        .order_by(NutritionPlan.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


async def _get_pet_or_404(pet_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession) -> Pet:
    stmt = select(Pet).where(Pet.id == pet_id, Pet.owner_id == user_id)
    result = await db.execute(stmt)
    pet = result.scalar_one_or_none()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found.")
    return pet
