import uuid
from datetime import datetime, date
from typing import Any

from pydantic import BaseModel, EmailStr, Field


# ─── Auth ─────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=2)
    phone: str | None = None


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    phone: str | None
    is_verified: bool
    is_veterinarian: bool
    avatar_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: UserResponse


class RefreshRequest(BaseModel):
    refresh_token: str


# ─── Pet ──────────────────────────────────────────────────

class PetCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    species: str
    breed: str | None = None
    sex: str
    birth_date: date | None = None
    weight_kg: float = Field(gt=0)
    height_cm: float | None = None
    activity_level: str = "moderate"
    is_neutered: bool = False
    known_allergies: str | None = None
    medical_conditions: str | None = None


class PetUpdate(BaseModel):
    name: str | None = None
    weight_kg: float | None = None
    activity_level: str | None = None
    is_neutered: bool | None = None
    known_allergies: str | None = None
    medical_conditions: str | None = None
    avatar_url: str | None = None


class PetResponse(BaseModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    name: str
    species: str
    breed: str | None
    sex: str
    birth_date: Any | None
    weight_kg: float
    activity_level: str
    is_neutered: bool
    known_allergies: str | None
    medical_conditions: str | None
    avatar_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class WeightLogCreate(BaseModel):
    weight_kg: float = Field(gt=0)
    calorie_intake: float | None = None
    notes: str | None = None


class WeightLogResponse(BaseModel):
    id: uuid.UUID
    pet_id: uuid.UUID
    weight_kg: float
    calorie_intake: float | None
    notes: str | None
    logged_at: datetime

    model_config = {"from_attributes": True}


# ─── Nutrition ────────────────────────────────────────────

class NutritionRequirementsResponse(BaseModel):
    pet_id: uuid.UUID
    daily_calories_kcal: float
    daily_protein_g: float
    daily_fat_g: float
    daily_carbs_g: float | None
    daily_fiber_g: float
    daily_calcium_mg: float
    daily_phosphorus_mg: float
    feeding_frequency: int
    bcs_target: str


class FoodScoringRequest(BaseModel):
    pet_id: uuid.UUID
    product_id: uuid.UUID
    daily_portion_g: float = Field(gt=0)


class FoodScoringResponse(BaseModel):
    product_id: uuid.UUID
    pet_id: uuid.UUID
    overall_score: float
    calorie_coverage_percent: float
    protein_coverage_percent: float
    fat_coverage_percent: float
    has_allergen: bool
    provided_nutrition: dict


class NutritionPlanResponse(BaseModel):
    id: uuid.UUID
    pet_id: uuid.UUID
    name: str
    daily_calories_kcal: float
    daily_protein_g: float
    daily_fat_g: float
    feeding_frequency: int
    is_active: bool
    valid_from: Any
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Analytics ────────────────────────────────────────────

class HealthAlertResponse(BaseModel):
    severity: str
    category: str
    message: str
    recommendation: str
    detected_at: str
    metric_value: float | None = None
    threshold: float | None = None


class AnalyticsSummaryResponse(BaseModel):
    pet_id: uuid.UUID
    data_points: list[dict]
    trend: str
    alert_count: int


# ─── Supply Chain ─────────────────────────────────────────

class BarcodeVerifyRequest(BaseModel):
    barcode: str = Field(min_length=1)


class VerificationResponse(BaseModel):
    is_authentic: bool
    confidence: float
    message: str
    verified_at: str
    product_name: str | None = None
    product_brand: str | None = None
    chain_data: dict = {}


# ─── Subscription ─────────────────────────────────────────

class SubscriptionCreate(BaseModel):
    pet_id: uuid.UUID
    product_id: uuid.UUID
    current_stock_g: float = Field(gt=0)
    delivery_address: str
    reorder_threshold_days: int = 7


class SubscriptionResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    pet_id: uuid.UUID
    product_id: uuid.UUID
    status: str
    predicted_daily_consumption_g: float | None
    reorder_threshold_days: int
    current_stock_g: float
    days_until_empty: float | None
    created_at: datetime

    model_config = {"from_attributes": True}
