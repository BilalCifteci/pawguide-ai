"""
Nutrition Engine
─────────────────
Calculates scientifically-based daily nutritional requirements
for cats and dogs following FEDIAF (2021) guidelines.
"""
from dataclasses import dataclass
from enum import Enum


class Species(str, Enum):
    DOG = "dog"
    CAT = "cat"


class ActivityLevel(str, Enum):
    SEDENTARY = "sedentary"
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    VERY_HIGH = "very_high"


@dataclass
class NutritionRequirements:
    daily_calories_kcal: float
    daily_protein_g: float
    daily_fat_g: float
    daily_carbs_g: float | None
    daily_fiber_g: float
    daily_calcium_mg: float
    daily_phosphorus_mg: float
    feeding_frequency: int
    bcs_target: str  # Body Condition Score 4-5/9


ACTIVITY_MULTIPLIERS = {
    ActivityLevel.SEDENTARY: 1.2,
    ActivityLevel.LOW: 1.4,
    ActivityLevel.MODERATE: 1.6,
    ActivityLevel.HIGH: 1.8,
    ActivityLevel.VERY_HIGH: 2.0,
}


def calculate_rer(weight_kg: float) -> float:
    """Resting Energy Requirement (kcal/day) using modified Kleiber formula."""
    return 70 * (weight_kg ** 0.75)


def calculate_daily_calories(
    weight_kg: float,
    species: str,
    activity_level: str,
    is_neutered: bool,
    age_years: float | None = None,
) -> float:
    """Maintenance Energy Requirement (MER) in kcal/day."""
    rer = calculate_rer(weight_kg)
    multiplier = ACTIVITY_MULTIPLIERS.get(activity_level, 1.6)

    # Neutered factor
    if is_neutered:
        multiplier *= 0.85

    # Life stage adjustments
    if age_years is not None:
        if age_years < 1:
            multiplier *= 1.5  # Growth
        elif species == Species.DOG and age_years >= 7:
            multiplier *= 0.9  # Senior dog
        elif species == Species.CAT and age_years >= 10:
            multiplier *= 0.9  # Senior cat

    return round(rer * multiplier, 1)


def calculate_nutrition_requirements(
    weight_kg: float,
    species: str,
    activity_level: str,
    is_neutered: bool,
    age_years: float | None = None,
    known_allergies: list[str] | None = None,
) -> NutritionRequirements:
    """
    Full FEDIAF-compliant daily nutrition requirements.

    Returns minimum requirements. Actual plan may exceed these
    depending on selected food products.
    """
    daily_kcal = calculate_daily_calories(
        weight_kg, species, activity_level, is_neutered, age_years
    )

    if species == Species.CAT:
        # Cats: obligate carnivores — higher protein, moderate fat
        protein_g = weight_kg * 5.0       # ~5g/kg body weight minimum
        fat_g = daily_kcal * 0.20 / 9    # 20% of calories from fat
        carbs_g = None                    # Cats don't require dietary carbs
        fiber_g = weight_kg * 0.5
        calcium_mg = weight_kg * 180
        phosphorus_mg = weight_kg * 140
        feeding_frequency = 3
    else:
        # Dogs: omnivores — balanced macros
        protein_g = weight_kg * 2.62      # FEDIAF minimum for adult dogs
        fat_g = daily_kcal * 0.15 / 9    # 15% of calories from fat
        carbs_g = (daily_kcal - protein_g * 3.5 - fat_g * 8.5) / 3.5
        carbs_g = max(carbs_g, 0)
        fiber_g = weight_kg * 0.7
        calcium_mg = weight_kg * 120
        phosphorus_mg = weight_kg * 100
        feeding_frequency = 2 if weight_kg < 10 else 2

    return NutritionRequirements(
        daily_calories_kcal=daily_kcal,
        daily_protein_g=round(protein_g, 1),
        daily_fat_g=round(fat_g, 1),
        daily_carbs_g=round(carbs_g, 1) if carbs_g is not None else None,
        daily_fiber_g=round(fiber_g, 1),
        daily_calcium_mg=round(calcium_mg, 1),
        daily_phosphorus_mg=round(phosphorus_mg, 1),
        feeding_frequency=feeding_frequency,
        bcs_target="4-5/9",
    )


def score_food_product(
    product: dict,
    requirements: NutritionRequirements,
    daily_portion_g: float,
    allergies: list[str] | None = None,
) -> dict:
    """
    Score a food product against nutritional requirements.
    Returns a match score (0-100) and per-nutrient coverage.
    """
    # Scale product nutrition to daily portion
    factor = daily_portion_g / 100  # product values per 100g

    provided = {
        "calories_kcal": product.get("calories_kcal", 0) * factor,
        "protein_g": product.get("protein_g", 0) * factor,
        "fat_g": product.get("fat_g", 0) * factor,
    }

    scores = []

    # Calorie coverage (80-120% = perfect)
    cal_coverage = provided["calories_kcal"] / requirements.daily_calories_kcal
    cal_score = 100 - abs(1.0 - cal_coverage) * 100
    scores.append(max(0, cal_score))

    # Protein adequacy (must meet minimum)
    prot_coverage = provided["protein_g"] / requirements.daily_protein_g
    prot_score = min(100, prot_coverage * 100)
    scores.append(prot_score)

    # Fat adequacy
    fat_coverage = provided["fat_g"] / requirements.daily_fat_g
    fat_score = min(100, fat_coverage * 100)
    scores.append(fat_score)

    # Allergen penalty
    allergen_penalty = 0
    if allergies and product.get("allergens"):
        product_allergens = [a.lower() for a in product["allergens"].split(",")]
        for allergy in allergies:
            if allergy.lower() in product_allergens:
                allergen_penalty = 50
                break

    overall_score = max(0, sum(scores) / len(scores) - allergen_penalty)

    return {
        "overall_score": round(overall_score, 1),
        "calorie_coverage_percent": round(cal_coverage * 100, 1),
        "protein_coverage_percent": round(prot_coverage * 100, 1),
        "fat_coverage_percent": round(fat_coverage * 100, 1),
        "has_allergen": allergen_penalty > 0,
        "provided_nutrition": provided,
    }
