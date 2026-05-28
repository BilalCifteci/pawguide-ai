import asyncio
import logging

from app.worker.celery_app import celery_app

logger = logging.getLogger(__name__)


def run_async(coro):
    """Run async function in Celery sync context."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(name="app.worker.tasks.run_daily_health_checks", bind=True, max_retries=3)
def run_daily_health_checks(self):
    """
    For every active pet, run anomaly detection on the latest weight logs
    and send email alerts if warnings are found.
    """
    async def _run():
        from app.db.session import AsyncSessionLocal
        from app.models.pet import Pet
        from app.models.weight_log import WeightLog
        from app.ml.anomaly_detector import PetHealthAnomalyDetector
        from sqlalchemy import select

        detector = PetHealthAnomalyDetector()
        async with AsyncSessionLocal() as db:
            pets = (await db.execute(select(Pet))).scalars().all()
            for pet in pets:
                logs = (
                    await db.execute(
                        select(WeightLog)
                        .where(WeightLog.pet_id == pet.id)
                        .order_by(WeightLog.logged_at.asc())
                        .limit(90)
                    )
                ).scalars().all()

                if not logs:
                    continue

                weight_data = [
                    {"weight_kg": l.weight_kg, "logged_at": l.logged_at.isoformat(), "calorie_intake": l.calorie_intake}
                    for l in logs
                ]
                alerts = detector.detect(weight_data, pet.weight_kg, pet.species.value, pet.breed)

                critical = [a for a in alerts if a.severity == "critical"]
                if critical:
                    logger.warning(f"Critical alerts for pet {pet.id}: {[a.message for a in critical]}")
                    # TODO: send email notification via send_alert_email.delay(...)

    try:
        run_async(_run())
        logger.info("Daily health checks completed.")
    except Exception as exc:
        logger.error(f"Health check failed: {exc}")
        raise self.retry(exc=exc, countdown=300)


@celery_app.task(name="app.worker.tasks.check_subscription_reorders")
def check_subscription_reorders():
    """
    Check all active subscriptions and trigger reorders for those
    running low on stock (based on ML-predicted consumption rate).
    """
    async def _run():
        from app.db.session import AsyncSessionLocal
        from app.models.subscription import Subscription, SubscriptionStatus
        from sqlalchemy import select

        async with AsyncSessionLocal() as db:
            stmt = select(Subscription).where(Subscription.status == SubscriptionStatus.ACTIVE)
            subs = (await db.execute(stmt)).scalars().all()

            for sub in subs:
                days_left = sub.days_until_empty
                if days_left is not None and days_left <= sub.reorder_threshold_days:
                    logger.info(
                        f"Subscription {sub.id}: {days_left:.1f} days of food left — triggering reorder."
                    )
                    # TODO: integrate with logistics API / send notification

    run_async(_run())


@celery_app.task(name="app.worker.tasks.retrain_anomaly_models")
def retrain_anomaly_models():
    """
    Retrain Isolation Forest models on accumulated weight log data.
    Saves updated models to /app/ml_models/.
    """
    async def _run():
        from app.db.session import AsyncSessionLocal
        from app.models.weight_log import WeightLog
        from app.ml.anomaly_detector import PetHealthAnomalyDetector
        from sqlalchemy import select
        import os

        async with AsyncSessionLocal() as db:
            logs = (
                await db.execute(
                    select(WeightLog).order_by(WeightLog.logged_at.asc()).limit(50000)
                )
            ).scalars().all()

            weights = [l.weight_kg for l in logs]
            calories = [l.calorie_intake or 0 for l in logs]

            if len(weights) >= 100:
                detector = PetHealthAnomalyDetector()
                detector.fit(weights, calories)
                os.makedirs("/app/ml_models", exist_ok=True)
                detector.save_model("/app/ml_models/anomaly_detector.joblib")
                logger.info(f"Anomaly model retrained on {len(weights)} samples.")

    run_async(_run())
