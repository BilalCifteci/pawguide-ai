import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.subscription import Subscription, SubscriptionStatus
from app.schemas.subscription import SubscriptionResponse, SubscriptionCreate

router = APIRouter()


@router.get("/", response_model=list[SubscriptionResponse])
async def list_subscriptions(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(Subscription).where(Subscription.user_id == user_id)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/", response_model=SubscriptionResponse, status_code=201)
async def create_subscription(
    payload: SubscriptionCreate,
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    sub = Subscription(**payload.model_dump(), user_id=user_id)
    db.add(sub)
    await db.flush()
    await db.refresh(sub)
    return sub


@router.patch("/{sub_id}/pause", response_model=SubscriptionResponse)
async def pause_subscription(sub_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    sub = await _get_sub_or_404(sub_id, user_id, db)
    sub.status = SubscriptionStatus.PAUSED
    await db.flush()
    await db.refresh(sub)
    return sub


@router.patch("/{sub_id}/resume", response_model=SubscriptionResponse)
async def resume_subscription(sub_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    sub = await _get_sub_or_404(sub_id, user_id, db)
    sub.status = SubscriptionStatus.ACTIVE
    await db.flush()
    await db.refresh(sub)
    return sub


async def _get_sub_or_404(sub_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession) -> Subscription:
    stmt = select(Subscription).where(Subscription.id == sub_id, Subscription.user_id == user_id)
    result = await db.execute(stmt)
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found.")
    return sub
