"""Tests for the drinking window status engine."""

from custom_components.vivino_cellar.models import Bottle, FoodCategory, Vintage
from custom_components.vivino_cellar.window_engine import (
    WINDOW_STATUS_HOLD,
    WINDOW_STATUS_NEAR_PAST_PEAK,
    WINDOW_STATUS_PAST_PEAK,
    WINDOW_STATUS_READY,
    WINDOW_STATUS_UNKNOWN,
    compute_vintage_window_status,
    compute_window_status,
)


def test_window_status_hold():
    """Wine with start year in the future should be on hold."""
    assert compute_window_status(2028, 2035, 2026) == WINDOW_STATUS_HOLD


def test_window_status_ready():
    """Wine where current year is between start and end year should be ready."""
    assert compute_window_status(2024, 2028, 2026) == WINDOW_STATUS_READY
    assert compute_window_status(2026, 2028, 2026) == WINDOW_STATUS_READY


def test_window_status_near_past_peak():
    """Wine where current year equals end year should be near past peak."""
    assert compute_window_status(2020, 2026, 2026) == WINDOW_STATUS_NEAR_PAST_PEAK
    assert compute_window_status(2026, 2026, 2026) == WINDOW_STATUS_NEAR_PAST_PEAK


def test_window_status_past_peak():
    """Wine where current year is past end year should be past peak."""
    assert compute_window_status(2015, 2025, 2026) == WINDOW_STATUS_PAST_PEAK


def test_window_status_unknown():
    """Wine with missing start or end year should be unknown."""
    assert compute_window_status(None, None, 2026) == WINDOW_STATUS_UNKNOWN
    assert compute_window_status(2020, None, 2026) == WINDOW_STATUS_UNKNOWN
    assert compute_window_status(None, 2026, 2026) == WINDOW_STATUS_UNKNOWN


def test_compute_vintage_window_status():
    """Test compute_vintage_window_status with a Vintage model."""
    bottle = Bottle(
        id=1,
        size_id=1,
        storage_location_id=1,
        location_name="Cellar",
        bin="1",
        created_at="2026-01-01",
    )
    vintage = Vintage(
        id=1,
        year=2020,
        name="Château Margaux",
        winery="Château Margaux",
        region="Margaux",
        country="France",
        type_id=1,
        grapes=["Cabernet Sauvignon"],
        image_url=None,
        rating=4.7,
        ratings_count=1200,
        foods=[FoodCategory(id=1, name="Beef", seo_name="beef", weight=0.8)],
        style=None,
        bottles=[bottle],
        start_year=2024,
        end_year=2030,
        window_source="vivino",
    )
    assert compute_vintage_window_status(vintage, 2026) == WINDOW_STATUS_READY
