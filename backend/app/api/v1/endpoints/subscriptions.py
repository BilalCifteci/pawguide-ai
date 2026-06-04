import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional

from app.api.deps import get_current_user_id
from app.db.session import get_db
from app.models.subscription import Subscription, SubscriptionStatus
from app.models.food_product import FoodProduct
from app.schemas.subscription import SubscriptionResponse, SubscriptionCreate

router = APIRouter()


class ActiveFoodResponse(BaseModel):
    subscription_id: uuid.UUID
    product_id: uuid.UUID
    name: str
    brand: str
    calories_kcal: float
    protein_g: float
    fat_g: float
    fiber_g: Optional[float]
    allergens: Optional[str]
    price_per_kg: Optional[float]
    frequency: str
    daily_amount_g: Optional[float]
    status: str

    model_config = {"from_attributes": True}


@router.get("/", response_model=list[SubscriptionResponse])
async def list_subscriptions(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Subscription).where(Subscription.user_id == user_id)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/active-food/{pet_id}", response_model=Optional[ActiveFoodResponse])
async def get_active_food(
    pet_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get the active subscription's food product for a specific pet."""
    stmt = (
        select(Subscription)
        .where(
            Subscription.user_id == user_id,
            Subscription.pet_id == pet_id,
            Subscription.status == SubscriptionStatus.ACTIVE,
        )
        .order_by(Subscription.created_at.desc())
        .limit(1)
    )
    result = await db.execute(stmt)
    sub = result.scalar_one_or_none()
    if not sub:
        return None

    stmt2 = select(FoodProduct).where(FoodProduct.id == sub.product_id)
    result2 = await db.execute(stmt2)
    product = result2.scalar_one_or_none()
    if not product:
        return None

    return ActiveFoodResponse(
        subscription_id=sub.id,
        product_id=product.id,
        name=product.name,
        brand=product.brand,
        calories_kcal=product.calories_kcal,
        protein_g=product.protein_g,
        fat_g=product.fat_g,
        fiber_g=product.fiber_g,
        allergens=product.allergens,
        price_per_kg=product.price_per_kg,
        frequency=sub.frequency,
        daily_amount_g=sub.daily_amount_g,
        status=sub.status.value,
    )


@router.post("/", response_model=SubscriptionResponse, status_code=201)
async def create_subscription(
    payload: SubscriptionCreate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    sub = Subscription(**payload.model_dump(), user_id=user_id)
    db.add(sub)
    await db.flush()
    await db.refresh(sub)
    return sub


@router.patch("/{sub_id}/pause", response_model=SubscriptionResponse)
async def pause_subscription(
    sub_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    sub = await _get_sub_or_404(sub_id, user_id, db)
    sub.status = SubscriptionStatus.PAUSED
    await db.flush()
    await db.refresh(sub)
    return sub


@router.patch("/{sub_id}/resume", response_model=SubscriptionResponse)
async def resume_subscription(
    sub_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    sub = await _get_sub_or_404(sub_id, user_id, db)
    sub.status = SubscriptionStatus.ACTIVE
    await db.flush()
    await db.refresh(sub)
    return sub


@router.delete("/{sub_id}", status_code=204)
async def delete_subscription(
    sub_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    sub = await _get_sub_or_404(sub_id, user_id, db)
    await db.delete(sub)


async def _get_sub_or_404(sub_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession) -> Subscription:
    stmt = select(Subscription).where(Subscription.id == sub_id, Subscription.user_id == user_id)
    result = await db.execute(stmt)
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found.")
    return sub
