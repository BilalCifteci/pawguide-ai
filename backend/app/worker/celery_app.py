"""
Celery Worker – Background Tasks
──────────────────────────────────
Handles:
  - Daily health alert checks for all active pets
  - Smart subscription reorder triggers
  - ML model retraining jobs
  - Email notifications
"""
from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_app = Celery(
    "pawguide",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.worker.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Europe/Istanbul",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    beat_schedule={
        # Run health checks every morning at 08:00
        "daily-health-checks": {
            "task": "app.worker.tasks.run_daily_health_checks",
            "schedule": crontab(hour=8, minute=0),
        },
        # Check subscription reorder needs every 6 hours
        "subscription-reorder-check": {
            "task": "app.worker.tasks.check_subscription_reorders",
            "schedule": crontab(minute=0, hour="*/6"),
        },
        # Retrain ML models weekly on Sunday at 02:00
        "weekly-model-retrain": {
            "task": "app.worker.tasks.retrain_anomaly_models",
            "schedule": crontab(hour=2, minute=0, day_of_week=0),
        },
    },
)
