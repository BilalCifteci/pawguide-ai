import pytest
from app.ml.nutrition_engine import (
    calculate_rer,
    calculate_daily_calories,
    calculate_nutrition_requirements,
    score_food_product,
)


def test_rer_calculation():
    """RER for a 10kg dog should be ~394 kcal."""
    rer = calculate_rer(10)
    assert 380 <= rer <= 420


def test_daily_calories_neutered_lower():
    """Neutered pets should have lower calorie needs."""
    intact = calculate_daily_calories(10, "dog", "moderate", is_neutered=False)
    neutered = calculate_daily_calories(10, "dog", "moderate", is_neutered=True)
    assert neutered < intact


def test_cat_has_no_required_carbs():
    reqs = calculate_nutrition_requirements(4.0, "cat", "moderate", False)
    assert reqs.daily_carbs_g is None


def test_dog_has_carbs():
    reqs = calculate_nutrition_requirements(10.0, "dog", "moderate", False)
    assert reqs.daily_carbs_g is not None
    assert reqs.daily_carbs_g >= 0


def test_activity_level_scaling():
    low = calculate_daily_calories(10, "dog", "low", False)
    high = calculate_daily_calories(10, "dog", "high", False)
    assert high > low


def test_food_scoring_allergen_penalty():
    from app.ml.nutrition_engine import NutritionRequirements
    reqs = NutritionRequirements(
        daily_calories_kcal=400,
        daily_protein_g=25,
        daily_fat_g=10,
        daily_carbs_g=30,
        daily_fiber_g=5,
        daily_calcium_mg=500,
        daily_phosphorus_mg=400,
        feeding_frequency=2,
        bcs_target="4-5/9",
    )
    product_with_allergen = {
        "calories_kcal": 400,
        "protein_g": 25,
        "fat_g": 10,
        "allergens": "chicken,wheat",
    }
    result = score_food_product(product_with_allergen, reqs, 100, allergies=["chicken"])
    assert result["has_allergen"] is True
    assert result["overall_score"] < 60  # penalized


def test_food_scoring_good_match():
    from app.ml.nutrition_engine import NutritionRequirements
    reqs = NutritionRequirements(
        daily_calories_kcal=400,
        daily_protein_g=25,
        daily_fat_g=10,
        daily_carbs_g=30,
        daily_fiber_g=5,
        daily_calcium_mg=500,
        daily_phosphorus_mg=400,
        feeding_frequency=2,
        bcs_target="4-5/9",
    )
    good_product = {
        "calories_kcal": 400,
        "protein_g": 25,
        "fat_g": 10,
        "allergens": "",
    }
    result = score_food_product(good_product, reqs, 100, allergies=[])
    assert result["overall_score"] >= 90
    assert result["has_allergen"] is False
