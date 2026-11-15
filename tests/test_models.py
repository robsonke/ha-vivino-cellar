"""Tests for vivino_cellar data models."""

from custom_components.vivino_cellar.models import (
    Bottle,
    CellarData,
    FoodCategory,
    Vintage,
    WineStyle,
)


def test_models_instantiation():
    bottle = Bottle(
        id=1,
        size_id=1,
        storage_location_id=10,
        location_name="Rack A",
        bin="3B",
        created_at="2026-01-01",
    )
    food = FoodCategory(id=101, name="Rundvlees", seo_name="beef", weight=0.5)
    vintage = Vintage(
        id=2001,
        year=2018,
        name="Barolo",
        winery="Vietti",
        region="Piedmont",
        country="Italy",
        type_id=1,
        grapes=["Nebbiolo"],
        image_url=None,
        rating=4.4,
        ratings_count=120,
        foods=[food],
        style=None,
        bottles=[bottle],
        start_year=2024,
        end_year=2030,
        window_source="vivino",
    )
    cellar = CellarData(
        cellar_id="651553",
        locale="nl",
        total_count=1,
        vintages=[vintage],
        food_categories=[food],
    )
    assert cellar.vintages[0].bottles[0].bin == "3B"
    assert cellar.food_categories[0].name == "Rundvlees"


def test_wine_style_instantiation():
    style = WineStyle(
        name="Italian Barolo",
        body=4.5,
        acidity=4.0,
        food=["beef", "game"],
    )
    assert style.name == "Italian Barolo"
    assert style.body == 4.5
    assert style.acidity == 4.0
    assert style.food == ["beef", "game"]


def test_const_definitions():
    from custom_components.vivino_cellar.const import (
        CONF_AI_TASK,
        CONF_CELLAR_URL,
        CONF_COOKIE,
        DOMAIN,
    )

    assert DOMAIN == "vivino_cellar"
    assert CONF_CELLAR_URL == "cellar_url"
    assert CONF_COOKIE == "cookie"
    assert CONF_AI_TASK == "ai_task"


def test_manifest():
    import json
    from pathlib import Path

    manifest_path = (
        Path(__file__).parent.parent
        / "custom_components"
        / "vivino_cellar"
        / "manifest.json"
    )
    assert manifest_path.exists()
    data = json.loads(manifest_path.read_text())
    assert data["domain"] == "vivino_cellar"
    assert data["version"] == "0.9.0"
    assert data["codeowners"] == ["@robsonke"]
