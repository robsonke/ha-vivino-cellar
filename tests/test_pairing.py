"""Tests for the Vivino Cellar wine pairing engine."""

from custom_components.vivino_cellar.models import (
    Bottle,
    FoodCategory,
    Vintage,
    WineStyle,
)
from custom_components.vivino_cellar.pairing import PairingResult, score_vintages


def _make_bottle(bottle_id: int = 1) -> Bottle:
    """Helper to create a test bottle."""
    return Bottle(
        id=bottle_id,
        size_id=1,
        storage_location_id=1,
        location_name="Cellar",
        bin="1",
        created_at="2026-01-01",
    )


def test_pairing_scoring_and_ranking():
    """Test pairing scoring, window adjustment, and filtering out wines without bottles."""
    bottle = _make_bottle()
    v_ready = Vintage(
        id=1,
        year=2020,
        name="Cabernet",
        winery="W1",
        region="Bordeaux",
        country="France",
        type_id=1,
        grapes=["Cabernet Sauvignon"],
        image_url=None,
        rating=4.5,
        ratings_count=100,
        foods=[FoodCategory(id=10, name="Beef", seo_name="beef", weight=0.5)],
        style=None,
        bottles=[bottle],
        start_year=2022,
        end_year=2028,
        window_source="vivino",
    )
    v_hold = Vintage(
        id=2,
        year=2024,
        name="Young Bordeaux",
        winery="W2",
        region="Bordeaux",
        country="France",
        type_id=1,
        grapes=["Merlot"],
        image_url=None,
        rating=4.8,
        ratings_count=50,
        foods=[FoodCategory(id=10, name="Beef", seo_name="beef", weight=0.5)],
        style=None,
        bottles=[bottle],
        start_year=2028,
        end_year=2035,
        window_source="vivino",
    )
    v_no_bottles = Vintage(
        id=3,
        year=2019,
        name="Empty Wine",
        winery="W3",
        region="Rioja",
        country="Spain",
        type_id=1,
        grapes=["Tempranillo"],
        image_url=None,
        rating=4.9,
        ratings_count=200,
        foods=[FoodCategory(id=10, name="Beef", seo_name="beef", weight=0.5)],
        style=None,
        bottles=[],
        start_year=2022,
        end_year=2028,
        window_source="vivino",
    )

    # Target: Beef (id 10) weight 1.0
    results = score_vintages(
        [v_ready, v_hold, v_no_bottles], {10: 1.0}, current_year=2026, max_results=3
    )

    assert len(results) == 2
    assert results[0].vintage.id == 1  # v_ready outranks v_hold because hold is penalized
    assert results[0].window_status == "ready"
    assert "Beef" in results[0].explanation


def test_pairing_zero_wine_weight_bonus():
    """Test that food categories with weight 0.0 on the wine receive the 0.1 bonus weight."""
    bottle = _make_bottle()
    # v_normal: wine weight 0.5 -> food_score = 1.0 * 0.5 = 0.5
    # v_zero: wine weight 0.0 -> bonus weight 0.1 -> food_score = 1.0 * 0.1 = 0.1
    v_normal = Vintage(
        id=1,
        year=2020,
        name="Normal Match",
        winery="W1",
        region="R1",
        country="C1",
        type_id=1,
        grapes=[],
        image_url=None,
        rating=4.0,
        ratings_count=10,
        foods=[FoodCategory(id=10, name="Beef", seo_name="beef", weight=0.5)],
        style=None,
        bottles=[bottle],
        start_year=2022,
        end_year=2028,
        window_source="vivino",
    )
    v_zero = Vintage(
        id=2,
        year=2020,
        name="Zero Weight Match",
        winery="W2",
        region="R2",
        country="C2",
        type_id=1,
        grapes=[],
        image_url=None,
        rating=4.0,
        ratings_count=10,
        foods=[FoodCategory(id=10, name="Beef", seo_name="beef", weight=0.0)],
        style=None,
        bottles=[bottle],
        start_year=2022,
        end_year=2028,
        window_source="vivino",
    )

    results = score_vintages([v_normal, v_zero], {10: 1.0}, current_year=2026)
    assert len(results) == 2
    # v_normal: 0.5 * 1.2 = 0.6
    assert results[0].vintage.id == 1
    assert results[0].match_score == 0.6
    # v_zero: 0.1 * 1.2 = 0.12
    assert results[1].vintage.id == 2
    assert results[1].match_score == 0.12


def test_pairing_window_multipliers():
    """Test all window status multipliers (near_past_peak=1.25, ready=1.2, unknown=1.0, hold=0.6, past_peak=0.5)."""
    bottle = _make_bottle()
    # current_year = 2026
    # v_near_past_peak: end_year == 2026 -> multiplier 1.25 -> 0.5 * 1.25 = 0.625
    # v_ready: 2022..2028 -> multiplier 1.2 -> 0.5 * 1.2 = 0.6
    # v_unknown: None..None -> multiplier 1.0 -> 0.5 * 1.0 = 0.5
    # v_hold: 2028..2035 -> multiplier 0.6 -> 0.5 * 0.6 = 0.3
    # v_past_peak: 2018..2024 -> multiplier 0.5 -> 0.5 * 0.5 = 0.25
    v_near = Vintage(
        id=1,
        year=2018,
        name="Near Past Peak",
        winery="W",
        region="R",
        country="C",
        type_id=1,
        grapes=[],
        image_url=None,
        rating=4.0,
        ratings_count=10,
        foods=[FoodCategory(id=10, name="Beef", seo_name="beef", weight=0.5)],
        style=None,
        bottles=[bottle],
        start_year=2020,
        end_year=2026,
        window_source="vivino",
    )
    v_ready = Vintage(
        id=2,
        year=2020,
        name="Ready",
        winery="W",
        region="R",
        country="C",
        type_id=1,
        grapes=[],
        image_url=None,
        rating=4.0,
        ratings_count=10,
        foods=[FoodCategory(id=10, name="Beef", seo_name="beef", weight=0.5)],
        style=None,
        bottles=[bottle],
        start_year=2022,
        end_year=2028,
        window_source="vivino",
    )
    v_unknown = Vintage(
        id=3,
        year=2020,
        name="Unknown",
        winery="W",
        region="R",
        country="C",
        type_id=1,
        grapes=[],
        image_url=None,
        rating=4.0,
        ratings_count=10,
        foods=[FoodCategory(id=10, name="Beef", seo_name="beef", weight=0.5)],
        style=None,
        bottles=[bottle],
        start_year=None,
        end_year=None,
        window_source="none",
    )
    v_hold = Vintage(
        id=4,
        year=2024,
        name="Hold",
        winery="W",
        region="R",
        country="C",
        type_id=1,
        grapes=[],
        image_url=None,
        rating=4.0,
        ratings_count=10,
        foods=[FoodCategory(id=10, name="Beef", seo_name="beef", weight=0.5)],
        style=None,
        bottles=[bottle],
        start_year=2028,
        end_year=2035,
        window_source="vivino",
    )
    v_past = Vintage(
        id=5,
        year=2015,
        name="Past Peak",
        winery="W",
        region="R",
        country="C",
        type_id=1,
        grapes=[],
        image_url=None,
        rating=4.0,
        ratings_count=10,
        foods=[FoodCategory(id=10, name="Beef", seo_name="beef", weight=0.5)],
        style=None,
        bottles=[bottle],
        start_year=2018,
        end_year=2024,
        window_source="vivino",
    )

    results = score_vintages(
        [v_past, v_hold, v_unknown, v_ready, v_near],
        {10: 1.0},
        current_year=2026,
        max_results=5,
    )

    assert len(results) == 5
    assert [r.vintage.id for r in results] == [1, 2, 3, 4, 5]
    assert results[0].window_status == "near_past_peak"
    assert results[0].match_score == 0.625
    assert results[1].window_status == "ready"
    assert results[1].match_score == 0.6
    assert results[2].window_status == "unknown"
    assert results[2].match_score == 0.5
    assert results[3].window_status == "hold"
    assert results[3].match_score == 0.3
    assert results[4].window_status == "past_peak"
    assert results[4].match_score == 0.25


def test_pairing_tie_break_by_rating():
    """Test that equal final scores are broken by vintage rating (descending)."""
    bottle = _make_bottle()
    v_low = Vintage(
        id=1,
        year=2020,
        name="Low Rating",
        winery="W",
        region="R",
        country="C",
        type_id=1,
        grapes=[],
        image_url=None,
        rating=3.9,
        ratings_count=10,
        foods=[FoodCategory(id=10, name="Beef", seo_name="beef", weight=0.5)],
        style=None,
        bottles=[bottle],
        start_year=2022,
        end_year=2028,
        window_source="vivino",
    )
    v_high = Vintage(
        id=2,
        year=2020,
        name="High Rating",
        winery="W",
        region="R",
        country="C",
        type_id=1,
        grapes=[],
        image_url=None,
        rating=4.7,
        ratings_count=10,
        foods=[FoodCategory(id=10, name="Beef", seo_name="beef", weight=0.5)],
        style=None,
        bottles=[bottle],
        start_year=2022,
        end_year=2028,
        window_source="vivino",
    )
    v_no_rating = Vintage(
        id=3,
        year=2020,
        name="No Rating",
        winery="W",
        region="R",
        country="C",
        type_id=1,
        grapes=[],
        image_url=None,
        rating=None,
        ratings_count=0,
        foods=[FoodCategory(id=10, name="Beef", seo_name="beef", weight=0.5)],
        style=None,
        bottles=[bottle],
        start_year=2022,
        end_year=2028,
        window_source="vivino",
    )

    results = score_vintages([v_no_rating, v_low, v_high], {10: 1.0}, current_year=2026)
    assert len(results) == 3
    assert [r.vintage.id for r in results] == [2, 1, 3]


def test_pairing_max_results():
    """Test that max_results truncates the returned list."""
    bottle = _make_bottle()
    vintages = [
        Vintage(
            id=i,
            year=2020,
            name=f"Wine {i}",
            winery="W",
            region="R",
            country="C",
            type_id=1,
            grapes=[],
            image_url=None,
            rating=4.0 + (i * 0.1),
            ratings_count=10,
            foods=[FoodCategory(id=10, name="Beef", seo_name="beef", weight=0.5)],
            style=None,
            bottles=[bottle],
            start_year=2022,
            end_year=2028,
            window_source="vivino",
        )
        for i in range(1, 6)
    ]

    results = score_vintages(vintages, {10: 1.0}, current_year=2026, max_results=2)
    assert len(results) == 2
    # Highest ratings are 5 and 4
    assert [r.vintage.id for r in results] == [5, 4]


def test_pairing_filters_unmatched_foods():
    """Test that vintages without matching food categories are filtered out."""
    bottle = _make_bottle()
    v_match = Vintage(
        id=1,
        year=2020,
        name="Matches Beef",
        winery="W",
        region="R",
        country="C",
        type_id=1,
        grapes=[],
        image_url=None,
        rating=4.0,
        ratings_count=10,
        foods=[FoodCategory(id=10, name="Beef", seo_name="beef", weight=0.5)],
        style=None,
        bottles=[bottle],
        start_year=2022,
        end_year=2028,
        window_source="vivino",
    )
    v_no_match = Vintage(
        id=2,
        year=2020,
        name="Matches Fish Only",
        winery="W",
        region="R",
        country="C",
        type_id=1,
        grapes=[],
        image_url=None,
        rating=4.9,
        ratings_count=100,
        foods=[FoodCategory(id=20, name="Fish", seo_name="fish", weight=0.5)],
        style=None,
        bottles=[bottle],
        start_year=2022,
        end_year=2028,
        window_source="vivino",
    )

    results = score_vintages([v_match, v_no_match], {10: 1.0}, current_year=2026)
    assert len(results) == 1
    assert results[0].vintage.id == 1


def test_pairing_multiple_foods_explanation():
    """Test scoring with multiple target food categories and explanation formatting."""
    bottle = _make_bottle()
    v_multi = Vintage(
        id=1,
        year=2020,
        name="Multi Pair Wine",
        winery="W",
        region="R",
        country="C",
        type_id=1,
        grapes=[],
        image_url=None,
        rating=4.5,
        ratings_count=10,
        foods=[
            FoodCategory(id=10, name="Beef", seo_name="beef", weight=0.5),
            FoodCategory(id=11, name="Game", seo_name="game", weight=0.5),
            FoodCategory(id=99, name="Dessert", seo_name="dessert", weight=0.5),
        ],
        style=None,
        bottles=[bottle],
        start_year=2022,
        end_year=2028,
        window_source="vivino",
    )

    # Target Beef weight 1.0, Game weight 0.5
    # Match score: (1.0 * 0.5) + (0.5 * 0.5) = 0.5 + 0.25 = 0.75
    # Ready multiplier: 1.2 -> final score = 0.75 * 1.2 = 0.9
    results = score_vintages([v_multi], {10: 1.0, 11: 0.5}, current_year=2026)
    assert len(results) == 1
    assert results[0].match_score == 0.9
    assert "Beef" in results[0].explanation
    assert "Game" in results[0].explanation
    assert "Dessert" not in results[0].explanation


def test_pairing_empty_inputs():
    """Test that empty vintages or empty target weights return empty results."""
    bottle = _make_bottle()
    vintage = Vintage(
        id=1,
        year=2020,
        name="Wine",
        winery="W",
        region="R",
        country="C",
        type_id=1,
        grapes=[],
        image_url=None,
        rating=4.0,
        ratings_count=10,
        foods=[FoodCategory(id=10, name="Beef", seo_name="beef", weight=0.5)],
        style=None,
        bottles=[bottle],
        start_year=2022,
        end_year=2028,
        window_source="vivino",
    )

    assert score_vintages([], {10: 1.0}, current_year=2026) == []
    assert score_vintages([vintage], {}, current_year=2026) == []


def test_pairing_style_food_fallback():
    """Test fallback to vintage.style.food when vintage.foods is empty."""
    bottle = _make_bottle()

    # Vintage with empty foods but style.food matching "beef"
    v_style_match = Vintage(
        id=1,
        year=2020,
        name="Barolo with Style Match",
        winery="Vietti",
        region="Piedmont",
        country="Italy",
        type_id=1,
        grapes=["Nebbiolo"],
        image_url=None,
        rating=4.5,
        ratings_count=100,
        foods=[],
        style=WineStyle(
            name="Italian Barolo",
            body=4.5,
            acidity=4.0,
            food=["Beef", "Game"],
        ),
        bottles=[bottle],
        start_year=2022,
        end_year=2028,
        window_source="vivino",
    )

    # Vintage with empty foods and style.food not matching "beef"
    v_style_no_match = Vintage(
        id=2,
        year=2022,
        name="Chablis with Fish Style",
        winery="William Fèvre",
        region="Chablis",
        country="France",
        type_id=2,
        grapes=["Chardonnay"],
        image_url=None,
        rating=4.3,
        ratings_count=80,
        foods=[],
        style=WineStyle(
            name="French Chablis",
            body=2.0,
            acidity=4.5,
            food=["Shellfish", "Lean Fish"],
        ),
        bottles=[bottle],
        start_year=2024,
        end_year=2030,
        window_source="vivino",
    )

    # Target: Beef (standard Vivino ID 1, or custom ID 10 with reference category)
    # Using Vivino standard category 1 (Beef)
    results = score_vintages(
        [v_style_match, v_style_no_match],
        {1: 1.0},
        current_year=2026,
    )

    assert len(results) == 1
    assert results[0].vintage.id == 1
    # Fallback score: target_weight (1.0) * fallback (0.3) * ready multiplier (1.2) = 0.36
    assert results[0].match_score == 0.36
    assert results[0].window_status == "ready"
    assert "Beef" in results[0].explanation

    # Also test matching when food category name/seo_name comes from another vintage in cellar
    v_reference = Vintage(
        id=3,
        year=2021,
        name="Cabernet with food cat",
        winery="Mondavi",
        region="Napa",
        country="USA",
        type_id=1,
        grapes=["Cabernet Sauvignon"],
        image_url=None,
        rating=4.2,
        ratings_count=50,
        foods=[FoodCategory(id=99, name="Beef", seo_name="beef", weight=0.5)],
        style=None,
        bottles=[bottle],
        start_year=2023,
        end_year=2029,
        window_source="vivino",
    )

    results_custom_id = score_vintages(
        [v_style_match, v_reference],
        {99: 1.0},
        current_year=2026,
    )
    # Both v_reference (via foods) and v_style_match (via style.food fallback) should match
    assert len(results_custom_id) == 2
    matched_ids = [r.vintage.id for r in results_custom_id]
    assert 1 in matched_ids
    assert 3 in matched_ids
