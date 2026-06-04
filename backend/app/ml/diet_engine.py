"""
Diet Engine
───────────
Veterinary-grade diet analysis:
  - Body Condition Score (BCS 1-9, WSAVA standard)
  - Ideal weight estimation by species/sex/neutered
  - Weekly calorie targets for weight loss/gain
  - Progress tracking and plan adjustment
"""
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class DietStatus(str, Enum):
    SEVERELY_UNDERWEIGHT = "severely_underweight"
    UNDERWEIGHT = "underweight"
    NORMAL = "normal"
    OVERWEIGHT = "overweight"
    OBESE = "obese"


STATUS_LABELS = {
    DietStatus.SEVERELY_UNDERWEIGHT: "Ciddi Zayif",
    DietStatus.UNDERWEIGHT: "Zayif",
    DietStatus.NORMAL: "Ideal Kilo",
    DietStatus.OVERWEIGHT: "Kilolu",
    DietStatus.OBESE: "Obez",
}

STATUS_COLORS = {
    DietStatus.SEVERELY_UNDERWEIGHT: "red",
    DietStatus.UNDERWEIGHT: "orange",
    DietStatus.NORMAL: "green",
    DietStatus.OVERWEIGHT: "orange",
    DietStatus.OBESE: "red",
}


@dataclass
class WeightTrend:
    direction: str          # "gaining" | "losing" | "stable"
    rate_per_week: float    # kg/week (positive = gaining)
    on_track: bool
    message: str


@dataclass
class DietAnalysis:
    status: DietStatus
    status_label: str
    status_color: str
    bcs_score: int              # 1-9
    bcs_description: str
    current_weight: float
    ideal_weight: float
    ideal_weight_min: float
    ideal_weight_max: float
    weight_to_lose: float       # negative = need to gain
    weight_percent_diff: float  # % above/below ideal

    # Calorie targets
    daily_calories_maintenance: int
    daily_calories_target: int
    calorie_adjustment: int     # positive = more, negative = less

    # Timeline
    weekly_weight_change_target: float  # kg/week
    weeks_to_goal: int

    # Progress (from weight logs)
    trend: Optional[WeightTrend]

    # Guidance
    summary: str
    phase: str                  # "weight_loss" | "weight_gain" | "maintenance"
    meal_frequency: int
    recommendations: list[str] = field(default_factory=list)


# ── IDEAL WEIGHT RANGES ────────────────────────────────────────────────────

def get_ideal_weight(species: str, sex: str, is_neutered: bool) -> tuple[float, float, float]:
    """
    Returns (min_kg, max_kg, ideal_kg) based on species/sex/neutered status.
    Sources: WSAVA Global Nutrition Guidelines, FEDIAF 2021.
    """
    if species == "cat":
        if sex == "male":
            return (4.5, 6.5, 5.2) if not is_neutered else (3.8, 5.5, 4.5)
        else:  # female
            return (3.5, 5.0, 4.0) if not is_neutered else (3.2, 4.5, 3.7)
    else:
        # Dogs: cannot determine ideal weight without breed data.
        # Use current weight with BCS-adjusted targets.
        return (None, None, None)


BCS_DESCRIPTIONS = {
    1: "Kaburgalar, omurga ve kemik cikintilari gorunuyor, yag yok",
    2: "Kaburgalar cok belirgin, minimal yag ortusu",
    3: "Kaburgalar kolayca hissedilir, minimal yag",
    4: "Kaburgalar hissedilebilir, hafif yag ortusu — zayif ideal",
    5: "Kaburgalar hissedilebilir, iyi yag ortusu — ideal",
    6: "Kaburgalar hissedilebilir ama yag ile ortulu — hafif fazla",
    7: "Kaburgalar zor hissedilir, belirgin yag birikmesi",
    8: "Kaburgalar hissedilemiyor, yogun yag, hareket guclugu",
    9: "Ciddi obezite, kalca ve boyun bolgelerinde buyuk yag kitleleri",
}


def estimate_bcs(ratio: float) -> int:
    """
    Estimate BCS (1-9) from weight/ideal_weight ratio.
    ratio = current_weight / ideal_weight
    """
    if ratio <= 0.72: return 1
    if ratio <= 0.82: return 2
    if ratio <= 0.91: return 3
    if ratio <= 1.06: return 4
    if ratio <= 1.12: return 5
    if ratio <= 1.22: return 6
    if ratio <= 1.33: return 7
    if ratio <= 1.48: return 8
    return 9


def classify_status(ratio: float) -> DietStatus:
    if ratio >= 1.30: return DietStatus.OBESE
    if ratio >= 1.15: return DietStatus.OVERWEIGHT
    if ratio >= 0.90: return DietStatus.NORMAL
    if ratio >= 0.80: return DietStatus.UNDERWEIGHT
    return DietStatus.SEVERELY_UNDERWEIGHT


# ── WEIGHT LOG TREND ANALYSIS ──────────────────────────────────────────────

def analyze_trend(weight_logs: list[dict], target_weekly_change: float) -> Optional[WeightTrend]:
    """
    Analyze recent weight logs to determine trend and progress.
    weight_logs: list of {"weight_kg": float, "logged_at": str}
    """
    if len(weight_logs) < 2:
        return None

    recent = weight_logs[-min(8, len(weight_logs)):]
    if len(recent) < 2:
        return None

    first_w = recent[0]["weight_kg"]
    last_w = recent[-1]["weight_kg"]
    n_logs = len(recent)

    # Estimate weeks between first and last log (assume 1-2 logs/week)
    weeks_elapsed = max(1, n_logs / 2)
    rate = (last_w - first_w) / weeks_elapsed

    if abs(rate) < 0.05:
        direction = "stable"
    elif rate > 0:
        direction = "gaining"
    else:
        direction = "losing"

    # Check if on track
    on_track = False
    if target_weekly_change == 0:
        on_track = abs(rate) < 0.05
        message = "Kilo sabit, hedefe uygun." if on_track else f"Haftada {abs(rate):.2f} kg degisim var, dikkat edin."
    elif target_weekly_change < 0:  # weight loss goal
        on_track = rate <= target_weekly_change * 0.5  # losing at least half the target
        if on_track:
            message = f"Haftada ~{abs(rate):.2f} kg veriliyor, hedef dogrultusunda!"
        else:
            message = f"Hedef haftada {abs(target_weekly_change):.2f} kg, ancak {abs(rate):.2f} kg veriliyor. Kaloriyi biraz daha azaltin."
    else:  # weight gain goal
        on_track = rate >= target_weekly_change * 0.5
        if on_track:
            message = f"Haftada ~{rate:.2f} kg aliniyor, hedef dogrultusunda!"
        else:
            message = f"Hedef haftada {target_weekly_change:.2f} kg almak, ancak {rate:.2f} kg aliniyor. Kaloriyi artirin."

    return WeightTrend(
        direction=direction,
        rate_per_week=round(rate, 3),
        on_track=on_track,
        message=message,
    )


# ── MAIN ANALYSIS ─────────────────────────────────────────────────────────

def analyze_diet(
    weight_kg: float,
    species: str,
    sex: str,
    is_neutered: bool,
    activity_level: str,
    age_years: Optional[float],
    maintenance_calories: float,
    weight_logs: list[dict],
) -> DietAnalysis:

    min_ideal, max_ideal, ideal_kg = get_ideal_weight(species, sex, is_neutered)

    # For dogs (no breed data): estimate ideal from current weight + neutered/activity factor
    if ideal_kg is None:
        base = weight_kg
        # Neutered dogs have ~20% higher obesity risk, adjust baseline down
        if is_neutered:
            base *= 0.92
        # Activity adjustment: sedentary dogs tend to be heavier than ideal
        activity_adj = {
            "sedentary": 0.90, "low": 0.93, "moderate": 1.0,
            "high": 1.03, "very_high": 1.05,
        }
        base *= activity_adj.get(activity_level, 1.0)

        # If we have weight history, use lowest recent stable weight as reference
        if len(weight_logs) >= 5:
            recent_weights = [w["weight_kg"] for w in weight_logs[-10:]]
            base = min(min(recent_weights) * 1.02, base)

        ideal_kg = round(base, 2)
        min_ideal = round(ideal_kg * 0.90, 2)
        max_ideal = round(ideal_kg * 1.10, 2)

    ratio = weight_kg / ideal_kg
    status = classify_status(ratio)
    bcs = estimate_bcs(ratio)
    weight_diff = round(weight_kg - ideal_kg, 2)
    pct_diff = round((ratio - 1.0) * 100, 1)

    # ── CALORIE & TIMELINE TARGETS ────────────────────────────────
    if status == DietStatus.OBESE:
        cal_mult, weekly_change, phase = 0.70, -0.50, "weight_loss"
    elif status == DietStatus.OVERWEIGHT:
        cal_mult, weekly_change, phase = 0.80, -0.30, "weight_loss"
    elif status == DietStatus.NORMAL:
        cal_mult, weekly_change, phase = 1.00, 0.00, "maintenance"
    elif status == DietStatus.UNDERWEIGHT:
        cal_mult, weekly_change, phase = 1.20, 0.20, "weight_gain"
    else:  # severely underweight
        cal_mult, weekly_change, phase = 1.30, 0.30, "weight_gain"

    # Senior adjustment: slower metabolism
    if age_years and ((species == "cat" and age_years >= 10) or (species == "dog" and age_years >= 8)):
        cal_mult *= 0.95

    target_cal = int(maintenance_calories * cal_mult)
    cal_adjustment = target_cal - int(maintenance_calories)

    weeks_to_goal = 0
    if weekly_change != 0 and abs(weight_diff) > 0.05:
        weeks_to_goal = max(1, int(abs(weight_diff) / abs(weekly_change)))

    meal_frequency = 3 if species == "cat" else 2

    # ── TREND ANALYSIS ────────────────────────────────────────────
    trend = analyze_trend(weight_logs, weekly_change)

    # If trend shows we're ahead of schedule, recalculate
    if trend and trend.on_track and status != DietStatus.NORMAL:
        # Slightly ease the restriction to prevent muscle loss
        if phase == "weight_loss" and trend.rate_per_week < weekly_change * 1.5:
            cal_mult = min(cal_mult + 0.05, 1.0)
            target_cal = int(maintenance_calories * cal_mult)
            cal_adjustment = target_cal - int(maintenance_calories)

    # ── RECOMMENDATIONS ───────────────────────────────────────────
    recs = _build_recommendations(
        status, species, weight_diff, target_cal, cal_adjustment,
        weeks_to_goal, ideal_kg, meal_frequency, trend, age_years, is_neutered,
    )

    # ── SUMMARY ───────────────────────────────────────────────────
    summaries = {
        DietStatus.OBESE: f"Ideal kilosundan %{abs(pct_diff):.0f} fazla ({abs(weight_diff):.1f} kg). Hemen diyet programi baslatilmali.",
        DietStatus.OVERWEIGHT: f"Ideal kilosundan %{abs(pct_diff):.0f} fazla ({abs(weight_diff):.1f} kg). Hafif diyet programi onerilir.",
        DietStatus.NORMAL: f"Ideal kiloda! ({ideal_kg:.1f} kg). Mevcut beslenmeyi surdurmeye devam edin.",
        DietStatus.UNDERWEIGHT: f"Ideal kilosundan %{abs(pct_diff):.0f} az ({abs(weight_diff):.1f} kg). Kalori artirimi gerekiyor.",
        DietStatus.SEVERELY_UNDERWEIGHT: f"Ciddi kilo eksikligi (%{abs(pct_diff):.0f}). Veteriner konsultasyonu onemle tavsiye edilir.",
    }

    return DietAnalysis(
        status=status,
        status_label=STATUS_LABELS[status],
        status_color=STATUS_COLORS[status],
        bcs_score=bcs,
        bcs_description=BCS_DESCRIPTIONS[bcs],
        current_weight=weight_kg,
        ideal_weight=ideal_kg,
        ideal_weight_min=min_ideal,
        ideal_weight_max=max_ideal,
        weight_to_lose=weight_diff,
        weight_percent_diff=pct_diff,
        daily_calories_maintenance=int(maintenance_calories),
        daily_calories_target=target_cal,
        calorie_adjustment=cal_adjustment,
        weekly_weight_change_target=weekly_change,
        weeks_to_goal=weeks_to_goal,
        trend=trend,
        summary=summaries[status],
        phase=phase,
        meal_frequency=meal_frequency,
        recommendations=recs,
    )


def _build_recommendations(
    status, species, weight_diff, target_cal, cal_adj,
    weeks, ideal_kg, meal_freq, trend, age_years, is_neutered,
) -> list[str]:
    recs = []

    if status == DietStatus.OBESE:
        recs += [
            f"Gunluk kaloriyi {abs(cal_adj)} kcal azaltin — hedef {target_cal} kcal/gun",
            f"Gunde {meal_freq} kucuk ogunle besleyin, buyuk porsiyonlardan kacinin",
            "Atistirmalik ve muavin yiyecekleri tamamen kesin",
            "Haftada en az 4 gun 20-30 dakika aktif oyun / yuruyus",
            f"Tahmini sure: {weeks} haftada {abs(weight_diff):.1f} kg vermek",
            "Veterinerinizi bilgilendirmenizi siddetle tavsiye ederiz",
        ]
    elif status == DietStatus.OVERWEIGHT:
        recs += [
            f"Gunluk kaloriyi {abs(cal_adj)} kcal azaltin — hedef {target_cal} kcal/gun",
            "Atistirmalik ve odulleri kentin, olcekli besleyin",
            "Gunluk aktiviteyi %20 artirin",
            f"Hedef: {weeks} haftada {abs(weight_diff):.1f} kg vermek",
        ]
    elif status == DietStatus.NORMAL:
        recs += [
            f"Gunluk {target_cal} kcal ile beslemeye devam edin",
            "Haftalik agirlik takibini ihmal etmeyin",
            "Mevcut aktivite seviyesini koruyun",
        ]
    elif status == DietStatus.UNDERWEIGHT:
        recs += [
            f"Gunluk kaloriyi {cal_adj} kcal artirin — hedef {target_cal} kcal/gun",
            f"Gunde {meal_freq + 1} defa besleyin",
            "Protein ve kalori yogun mamalar secin",
            f"Hedef: {weeks} haftada {abs(weight_diff):.1f} kg almak",
        ]
    else:  # severely underweight
        recs += [
            "Veterinere derhal goturmenizi oneririz",
            f"Gunluk kaloriyi {cal_adj} kcal artirin — hedef {target_cal} kcal/gun",
            "Gunluk agirlik takibi yapın",
            "Ilerleme olmuyorsa veteriner mudahalesi gerekebilir",
        ]

    if is_neutered and status in (DietStatus.OVERWEIGHT, DietStatus.OBESE):
        recs.append("Kisirlastrma metabolizmay yavaslatir — porsiyon kontrolu kritik onem tasir")

    if age_years and species == "cat" and age_years >= 10:
        recs.append("Yas nedeniyle metabolizma yavastir, kalori dususu daha etkili olacaktir")

    if trend and not trend.on_track:
        recs.append(f"Gecen haftalara gore ilerleme: {trend.message}")

    return recs
