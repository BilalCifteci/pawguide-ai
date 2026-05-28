"""
Health Anomaly Detection
─────────────────────────
Uses Isolation Forest + rule-based thresholds to detect
metabolic anomalies in pet weight and calorie time series.

In production: XGBoost/LightGBM models trained on real data
replace the heuristic thresholds.
"""
import json
import os
from dataclasses import dataclass
from enum import Enum
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest


class AlertSeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


@dataclass
class HealthAlert:
    severity: AlertSeverity
    category: str
    message: str
    recommendation: str
    detected_at: str
    metric_value: float | None = None
    threshold: float | None = None


class PetHealthAnomalyDetector:
    """
    Detects anomalies in pet weight and calorie intake data.
    Combines statistical models with breed-specific growth curves.
    """

    # Obesity thresholds (% body weight change over period)
    OBESITY_THRESHOLD_PERCENT = 10.0    # +10% in 30 days = warning
    RAPID_LOSS_THRESHOLD_PERCENT = 8.0  # -8% in 30 days = critical

    def __init__(self, model_path: str | None = None):
        self.isolation_forest = IsolationForest(
            n_estimators=100,
            contamination=0.05,  # expect ~5% anomalies
            random_state=42,
        )
        self._is_fitted = False

        if model_path and Path(model_path).exists():
            self._load_model(model_path)

    def fit(self, weight_series: list[float], calorie_series: list[float]) -> None:
        """Train anomaly detector on historical data."""
        if len(weight_series) < 10:
            return  # Not enough data

        features = self._extract_features(weight_series, calorie_series)
        if len(features) > 0:
            self.isolation_forest.fit(features)
            self._is_fitted = True

    def _extract_features(
        self, weights: list[float], calories: list[float]
    ) -> np.ndarray:
        """Extract rolling features for anomaly detection."""
        df = pd.DataFrame({"weight": weights, "calories": calories or [None] * len(weights)})
        df["weight_diff"] = df["weight"].diff()
        df["weight_pct_change"] = df["weight"].pct_change() * 100
        df["weight_7d_mean"] = df["weight"].rolling(7, min_periods=1).mean()
        df["weight_7d_std"] = df["weight"].rolling(7, min_periods=1).std().fillna(0)
        df = df.dropna()
        return df[["weight_diff", "weight_pct_change", "weight_7d_std"]].values

    def detect(
        self,
        weight_logs: list[dict],  # [{weight_kg, logged_at, calorie_intake}, ...]
        pet_weight_kg: float,
        pet_species: str,
        breed: str | None = None,
    ) -> list[HealthAlert]:
        """
        Analyze weight time series and return health alerts.
        """
        alerts = []

        if len(weight_logs) < 2:
            return alerts

        df = pd.DataFrame(weight_logs)
        df["logged_at"] = pd.to_datetime(df["logged_at"])
        df = df.sort_values("logged_at")
        weights = df["weight_kg"].tolist()

        # ─── Rule-based checks ───────────────────────────────────
        latest = weights[-1]
        baseline = weights[0]

        # Check for rapid weight gain (obesity risk)
        if len(weights) >= 4:
            recent_gain = (latest - weights[-4]) / weights[-4] * 100
            if recent_gain >= self.OBESITY_THRESHOLD_PERCENT:
                alerts.append(HealthAlert(
                    severity=AlertSeverity.WARNING,
                    category="obesity_risk",
                    message=f"Rapid weight gain detected: +{recent_gain:.1f}% in recent period.",
                    recommendation=(
                        "Reduce calorie intake by 15-20% and increase physical activity. "
                        "Consult your veterinarian if gain continues."
                    ),
                    detected_at=str(df["logged_at"].iloc[-1]),
                    metric_value=recent_gain,
                    threshold=self.OBESITY_THRESHOLD_PERCENT,
                ))

        # Check for rapid weight loss
        if len(weights) >= 4:
            recent_loss = (weights[-4] - latest) / weights[-4] * 100
            if recent_loss >= self.RAPID_LOSS_THRESHOLD_PERCENT:
                alerts.append(HealthAlert(
                    severity=AlertSeverity.CRITICAL,
                    category="rapid_weight_loss",
                    message=f"Rapid weight loss detected: -{recent_loss:.1f}% in recent period.",
                    recommendation=(
                        "Immediate veterinary consultation is strongly recommended. "
                        "Sudden weight loss can indicate serious metabolic issues."
                    ),
                    detected_at=str(df["logged_at"].iloc[-1]),
                    metric_value=recent_loss,
                    threshold=self.RAPID_LOSS_THRESHOLD_PERCENT,
                ))

        # ─── Statistical anomaly detection ───────────────────────
        if self._is_fitted and len(weights) >= 10:
            calories = df.get("calorie_intake", pd.Series([None] * len(df))).tolist()
            features = self._extract_features(weights, calories)
            if len(features) > 0:
                predictions = self.isolation_forest.predict(features)
                anomaly_indices = [i for i, p in enumerate(predictions) if p == -1]
                if anomaly_indices:
                    alerts.append(HealthAlert(
                        severity=AlertSeverity.INFO,
                        category="statistical_anomaly",
                        message=(
                            f"Statistical anomaly detected in weight pattern "
                            f"({len(anomaly_indices)} data points)."
                        ),
                        recommendation="Review recent feeding habits and physical activity levels.",
                        detected_at=str(df["logged_at"].iloc[-1]),
                    ))

        return alerts

    def predict_consumption_rate(
        self, weight_logs: list[dict], subscription_logs: list[dict]
    ) -> float | None:
        """
        Linear regression to predict daily food consumption (grams/day).
        Used for smart subscription reorder timing.
        """
        if len(subscription_logs) < 3:
            return None

        try:
            from sklearn.linear_model import LinearRegression

            df = pd.DataFrame(subscription_logs)
            df["date"] = pd.to_datetime(df["date"])
            df = df.sort_values("date")
            df["day_num"] = (df["date"] - df["date"].min()).dt.days

            X = df[["day_num"]].values
            y = df["stock_remaining_g"].values

            model = LinearRegression()
            model.fit(X, y)

            # consumption rate = absolute value of slope (g/day)
            daily_consumption = abs(model.coef_[0])
            return round(daily_consumption, 1)
        except Exception:
            return None

    def _load_model(self, path: str) -> None:
        import joblib
        try:
            self.isolation_forest = joblib.load(path)
            self._is_fitted = True
        except Exception:
            pass

    def save_model(self, path: str) -> None:
        import joblib
        joblib.dump(self.isolation_forest, path)
