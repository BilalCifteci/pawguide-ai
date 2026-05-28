import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.pet import Pet
from app.models.weight_log import WeightLog
from app.ml.anomaly_detector import PetHealthAnomalyDetector
from app.schemas.analytics import HealthAlertResponse, AnalyticsSummaryResponse

router = APIRouter()
detector = PetHealthAnomalyDetector()


@router.get("/health-alerts/{pet_id}", response_model=list[HealthAlertResponse])
async def get_health_alerts(
    pet_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Run anomaly detection on pet's weight logs and return alerts."""
    pet = await _get_pet_or_404(pet_id, user_id, db)

    stmt = (
        select(WeightLog)
        .where(WeightLog.pet_id == pet_id)
        .order_by(WeightLog.logged_at.asc())
        .limit(180)
    )
    result = await db.execute(stmt)
    logs = result.scalars().all()

    weight_data = [
        {
            "weight_kg": log.weight_kg,
            "logged_at": log.logged_at.isoformat(),
            "calorie_intake": log.calorie_intake,
        }
        for log in logs
    ]

    alerts = detector.detect(
        weight_logs=weight_data,
        pet_weight_kg=pet.weight_kg,
        pet_species=pet.species.value,
        breed=pet.breed,
    )

    return [
        HealthAlertResponse(
            severity=a.severity,
            category=a.category,
            message=a.message,
            recommendation=a.recommendation,
            detected_at=a.detected_at,
            metric_value=a.metric_value,
            threshold=a.threshold,
        )
        for a in alerts
    ]


@router.get("/summary/{pet_id}", response_model=AnalyticsSummaryResponse)
async def get_analytics_summary(
    pet_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Return weight trend summary for dashboard charts."""
    await _get_pet_or_404(pet_id, user_id, db)

    stmt = (
        select(WeightLog)
        .where(WeightLog.pet_id == pet_id)
        .order_by(WeightLog.logged_at.asc())
        .limit(90)
    )
    result = await db.execute(stmt)
    logs = result.scalars().all()

    if not logs:
        return AnalyticsSummaryResponse(
            pet_id=pet_id, data_points=[], trend="stable", alert_count=0
        )

    data_points = [
        {"date": log.logged_at.date().isoformat(), "weight_kg": log.weight_kg}
        for log in logs
    ]

    weights = [log.weight_kg for log in logs]
    if len(weights) >= 2:
        change = (weights[-1] - weights[0]) / weights[0] * 100
        trend = "increasing" if change > 2 else "decreasing" if change < -2 else "stable"
    else:
        trend = "stable"

    return AnalyticsSummaryResponse(
        pet_id=pet_id,
        data_points=data_points,
        trend=trend,
        alert_count=0,  # Populated after calling health-alerts endpoint
    )


async def _get_pet_or_404(pet_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession) -> Pet:
    stmt = select(Pet).where(Pet.id == pet_id, Pet.owner_id == user_id)
    result = await db.execute(stmt)
    pet = result.scalar_one_or_none()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found.")
    return pet
