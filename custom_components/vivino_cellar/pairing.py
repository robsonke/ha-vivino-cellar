"""Wine pairing engine for Vivino Cellar."""

from dataclasses import dataclass

from .models import Vintage
from .window_engine import (
    WINDOW_STATUS_CAN_WAIT,
    WINDOW_STATUS_HOLD,
    WINDOW_STATUS_NEAR_PAST_PEAK,
    WINDOW_STATUS_PAST_PEAK,
    WINDOW_STATUS_READY,
    WINDOW_STATUS_UNKNOWN,
    compute_vintage_window_status,
)

WINDOW_MULTIPLIERS: dict[str, float] = {
    WINDOW_STATUS_READY: 1.2,
    # Drinkable, but no hurry: rank below wines that should go sooner.
    WINDOW_STATUS_CAN_WAIT: 1.1,
    WINDOW_STATUS_NEAR_PAST_PEAK: 1.25,
    WINDOW_STATUS_HOLD: 0.6,
    WINDOW_STATUS_PAST_PEAK: 0.5,
    WINDOW_STATUS_UNKNOWN: 1.0,
}

ZERO_WEIGHT_BONUS = 0.1
STYLE_FOOD_FALLBACK_WEIGHT = 0.3

# Standard Vivino food category ID -> (Name, seo_name)
KNOWN_FOOD_CATEGORIES: dict[int, tuple[str, str]] = {
    1: ("Beef", "beef"),
    2: ("Pork", "pork"),
    3: ("Game", "game"),
    4: ("Poultry", "poultry"),
    5: ("Pasta", "pasta"),
    6: ("Veal", "veal"),
    7: ("Cured Meat", "cured-meat"),
    8: ("Rich Fish", "rich-fish"),
    9: ("Sweet Desserts", "sweet-dessert"),
    10: ("Blue Cheese", "blue-cheese"),
    11: ("Spicy Food", "spicy-food"),
    12: ("Aperitif", "aperitif"),
    13: ("Fruity Desserts", "fruity-dessert"),
    14: ("Lean Fish", "lean-fish"),
    15: ("Mild Cheese", "mild-cheese"),
    16: ("Goat Cheese", "goat-cheese"),
    17: ("Lamb", "lamb"),
    18: ("Vegetarian", "vegetarian"),
    19: ("Shellfish", "shellfish"),
    20: ("Mushrooms", "mushrooms"),
}


@dataclass(slots=True)
class PairingResult:
    """Result of scoring a vintage for a food pairing."""

    vintage: Vintage
    match_score: float
    window_status: str
    explanation: str


def score_vintages(
    vintages: list[Vintage],
    target_food_weights: dict[int, float],
    current_year: int,
    max_results: int = 3,
) -> list[PairingResult]:
    """Score and rank cellar vintages against target food category weights.

    Scoring logic:
    - Filter out vintages without physical bottles (len(bottles) == 0).
    - Food match score = sum(target_weight[f] * wine_weight[f]). If wine_weight is 0.0,
      the bonus weight 0.1 is used.
    - Multiplied by drinking window multiplier (ready: 1.2, can_wait: 1.1, near_past_peak: 1.25,
      hold: 0.6, past_peak: 0.5, unknown: 1.0).
    - Tie-break by vintage.rating descending.
    - Return top max_results.
    """
    if not vintages or not target_food_weights or max_results <= 0:
        return []

    # Build target food name/seo_name mapping from vintages and known categories
    target_names_by_id: dict[int, set[str]] = {}
    target_display_by_id: dict[int, str] = {}

    for v in vintages:
        for f in v.foods:
            if f.id in target_food_weights:
                s = target_names_by_id.setdefault(f.id, set())
                if f.name:
                    s.add(f.name.strip().lower())
                if f.seo_name:
                    s.add(f.seo_name.strip().lower())
                if f.id not in target_display_by_id and f.name:
                    target_display_by_id[f.id] = f.name

    for fid in target_food_weights:
        if fid in KNOWN_FOOD_CATEGORIES:
            k_name, k_seo = KNOWN_FOOD_CATEGORIES[fid]
            s = target_names_by_id.setdefault(fid, set())
            s.add(k_name.strip().lower())
            s.add(k_seo.strip().lower())
            if fid not in target_display_by_id:
                target_display_by_id[fid] = k_name

    results: list[PairingResult] = []

    for vintage in vintages:
        if not vintage.bottles:
            continue

        raw_match_score = 0.0
        matched_foods: list[tuple[float, str]] = []

        if vintage.foods:
            for food in vintage.foods:
                if food.id in target_food_weights:
                    target_weight = target_food_weights[food.id]
                    if target_weight <= 0.0:
                        continue
                    wine_weight = (
                        ZERO_WEIGHT_BONUS if food.weight == 0.0 else food.weight
                    )
                    contribution = target_weight * wine_weight
                    raw_match_score += contribution
                    matched_foods.append((contribution, food.name))
        elif vintage.style and vintage.style.food:
            matched_target_ids: set[int] = set()
            for item in vintage.style.food:
                if isinstance(item, dict):
                    item_str = item.get("seo_name") or item.get("name") or ""
                else:
                    item_str = str(item)
                item_clean = item_str.strip().lower()
                if not item_clean:
                    continue

                for fid, target_weight in target_food_weights.items():
                    if target_weight <= 0.0 or fid in matched_target_ids:
                        continue
                    names_for_id = target_names_by_id.get(fid, set())
                    matched = False
                    if item_clean in names_for_id:
                        matched = True
                    else:
                        for candidate in names_for_id:
                            if item_clean in candidate or candidate in item_clean:
                                matched = True
                                break

                    if matched:
                        matched_target_ids.add(fid)
                        contribution = target_weight * STYLE_FOOD_FALLBACK_WEIGHT
                        raw_match_score += contribution
                        display_name = target_display_by_id.get(
                            fid, item_str.strip().title()
                        )
                        matched_foods.append((contribution, display_name))

        if raw_match_score <= 0.0:
            continue

        window_status = compute_vintage_window_status(vintage, current_year)
        multiplier = WINDOW_MULTIPLIERS.get(window_status, 1.0)
        final_score = round(raw_match_score * multiplier, 4)

        # Sort matched foods by contribution descending, then name
        matched_foods.sort(key=lambda item: (-item[0], item[1]))
        matched_names = [name for _, name in matched_foods]
        explanation = f"Pairs with {', '.join(matched_names)}"

        results.append(
            PairingResult(
                vintage=vintage,
                match_score=final_score,
                window_status=window_status,
                explanation=explanation,
            )
        )

    # Sort by final score descending, tie-break by rating descending, then ratings count
    results.sort(
        key=lambda r: (
            -r.match_score,
            -(r.vintage.rating if r.vintage.rating is not None else 0.0),
            -(r.vintage.ratings_count or 0),
        )
    )

    return results[:max_results]
