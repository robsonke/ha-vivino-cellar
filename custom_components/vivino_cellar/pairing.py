"""Wine pairing engine for Vivino Cellar."""

from dataclasses import dataclass

from .models import Vintage
from .window_engine import (
    WINDOW_STATUS_HOLD,
    WINDOW_STATUS_NEAR_PAST_PEAK,
    WINDOW_STATUS_PAST_PEAK,
    WINDOW_STATUS_READY,
    WINDOW_STATUS_UNKNOWN,
    compute_vintage_window_status,
)

WINDOW_MULTIPLIERS: dict[str, float] = {
    WINDOW_STATUS_READY: 1.2,
    WINDOW_STATUS_NEAR_PAST_PEAK: 1.25,
    WINDOW_STATUS_HOLD: 0.6,
    WINDOW_STATUS_PAST_PEAK: 0.5,
    WINDOW_STATUS_UNKNOWN: 1.0,
}

ZERO_WEIGHT_BONUS = 0.1


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
    - Multiplied by drinking window multiplier (ready: 1.2, near_past_peak: 1.25,
      hold: 0.6, past_peak: 0.5, unknown: 1.0).
    - Tie-break by vintage.rating descending.
    - Return top max_results.
    """
    if not vintages or not target_food_weights or max_results <= 0:
        return []

    results: list[PairingResult] = []

    for vintage in vintages:
        if not vintage.bottles:
            continue

        raw_match_score = 0.0
        matched_foods: list[tuple[float, str]] = []

        for food in vintage.foods:
            if food.id in target_food_weights:
                target_weight = target_food_weights[food.id]
                if target_weight <= 0.0:
                    continue
                wine_weight = ZERO_WEIGHT_BONUS if food.weight == 0.0 else food.weight
                contribution = target_weight * wine_weight
                raw_match_score += contribution
                matched_foods.append((contribution, food.name))

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
