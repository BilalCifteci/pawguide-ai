import pytest
from app.ml.anomaly_detector import PetHealthAnomalyDetector, AlertSeverity


def make_logs(weights: list[float]) -> list[dict]:
    from datetime import datetime, timedelta
    base = datetime(2024, 1, 1)
    return [
        {"weight_kg": w, "logged_at": (base + timedelta(days=i)).isoformat(), "calorie_intake": 400}
        for i, w in enumerate(weights)
    ]


def test_no_alerts_stable_weight():
    detector = PetHealthAnomalyDetector()
    # Stable weight around 10kg
    weights = [10.0, 10.1, 9.9, 10.05, 10.0, 10.1, 10.0, 10.05]
    logs = make_logs(weights)
    alerts = detector.detect(logs, 10.0, "dog")
    assert len(alerts) == 0


def test_obesity_alert_rapid_gain():
    detector = PetHealthAnomalyDetector()
    # +15% gain in 4 readings
    weights = [10.0, 10.5, 11.0, 11.5, 11.6]
    logs = make_logs(weights)
    alerts = detector.detect(logs, 11.6, "dog")
    categories = [a.category for a in alerts]
    assert "obesity_risk" in categories


def test_critical_alert_rapid_loss():
    detector = PetHealthAnomalyDetector()
    # -10% drop in 4 readings
    weights = [10.0, 9.5, 9.2, 9.0, 8.9]
    logs = make_logs(weights)
    alerts = detector.detect(logs, 8.9, "dog")
    categories = [a.category for a in alerts]
    assert "rapid_weight_loss" in categories
    severities = [a.severity for a in alerts]
    assert AlertSeverity.CRITICAL in severities


def test_insufficient_data_no_crash():
    detector = PetHealthAnomalyDetector()
    logs = make_logs([10.0])
    alerts = detector.detect(logs, 10.0, "cat")
    assert alerts == []
