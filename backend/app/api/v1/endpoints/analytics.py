import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.pet import Pet
from app.models.weight_log import WeightLog
from app.ml.anomaly_detector import PetHealthAnomalyDetector
from app.ml.nutrition_engine import calculate_nutrition_requirements
from app.ml.diet_engine import analyze_diet
from app.schemas.analytics import HealthAlertResponse, AnalyticsSummaryResponse
from app.schemas import DietAnalysisResponse, WeightTrendResponse

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


@router.get("/diet/{pet_id}", response_model=DietAnalysisResponse)
async def get_diet_analysis(
    pet_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Full diet analysis for a pet.
    Recalculates automatically on each call — call after each weight log.
    """
    pet = await _get_pet_or_404(pet_id, user_id, db)

    # Get weight logs (newest last for trend analysis)
    stmt = (
        select(WeightLog)
        .where(WeightLog.pet_id == pet_id)
        .order_by(WeightLog.logged_at.asc())
        .limit(52)  # ~1 year of weekly logs
    )
    result = await db.execute(stmt)
    logs = result.scalars().all()

    weight_logs = [
        {"weight_kg": log.weight_kg, "logged_at": log.logged_at.isoformat()}
        for log in logs
    ]

    # Calculate maintenance calories
    age_years = None
    if pet.birth_date:
        delta = date.today() - pet.birth_date
        age_years = delta.days / 365.25

    requirements = calculate_nutrition_requirements(
        weight_kg=pet.weight_kg,
        species=pet.species.value,
        activity_level=pet.activity_level.value,
        is_neutered=pet.is_neutered,
        age_years=age_years,
    )

    analysis = analyze_diet(
        weight_kg=pet.weight_kg,
        species=pet.species.value,
        sex=pet.sex.value,
        is_neutered=pet.is_neutered,
        activity_level=pet.activity_level.value,
        age_years=age_years,
        maintenance_calories=requirements.daily_calories_kcal,
        weight_logs=weight_logs,
    )

    trend_resp = None
    if analysis.trend:
        trend_resp = WeightTrendResponse(
            direction=analysis.trend.direction,
            rate_per_week=analysis.trend.rate_per_week,
            on_track=analysis.trend.on_track,
            message=analysis.trend.message,
        )

    return DietAnalysisResponse(
        status=analysis.status.value,
        status_label=analysis.status_label,
        status_color=analysis.status_color,
        bcs_score=analysis.bcs_score,
        bcs_description=analysis.bcs_description,
        current_weight=analysis.current_weight,
        ideal_weight=analysis.ideal_weight,
        ideal_weight_min=analysis.ideal_weight_min,
        ideal_weight_max=analysis.ideal_weight_max,
        weight_to_lose=analysis.weight_to_lose,
        weight_percent_diff=analysis.weight_percent_diff,
        daily_calories_maintenance=analysis.daily_calories_maintenance,
        daily_calories_target=analysis.daily_calories_target,
        calorie_adjustment=analysis.calorie_adjustment,
        weekly_weight_change_target=analysis.weekly_weight_change_target,
        weeks_to_goal=analysis.weeks_to_goal,
        trend=trend_resp,
        summary=analysis.summary,
        phase=analysis.phase,
        meal_frequency=analysis.meal_frequency,
        recommendations=analysis.recommendations,
    )


@router.get("/summary/{pet_id}", response_model=AnalyticsSummaryResponse)
async def get_analytics_summary(
    pet_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
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
        alert_count=0,
    )


async def _get_pet_or_404(pet_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession) -> Pet:
    stmt = select(Pet).where(Pet.id == pet_id, Pet.owner_id == user_id)
    result = await db.execute(stmt)
    pet = result.scalar_one_or_none()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found.")
    return pet
