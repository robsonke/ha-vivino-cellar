"""Tests for Vivino Cellar Assist voice intent."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.vivino_cellar.const import DOMAIN, INTENT_SUGGEST_WINE
from custom_components.vivino_cellar.exceptions import VivinoError
from custom_components.vivino_cellar.intent import (
    Intent,
    VivinoCellarSuggestWineIntent,
    async_setup_intents,
    async_unload_intents,
)
from custom_components.vivino_cellar.models import (
    Bottle,
    CellarData,
    FoodCategory,
    Vintage,
)
from custom_components.vivino_cellar.pairing import PairingResult


class MockHass:
    """Mock HomeAssistant."""

    def __init__(self) -> None:
        self.data: dict = {}


def _create_sample_pairing_results() -> list[PairingResult]:
    """Create sample pairing results for tests."""
    bottle1 = Bottle(
        id=101,
        size_id=1,
        storage_location_id=10,
        location_name="Wine Fridge",
        bin="A1",
        created_at="2024-01-01",
    )
    bottle2 = Bottle(
        id=102,
        size_id=1,
        storage_location_id=10,
        location_name="Wine Fridge",
        bin="A2",
        created_at="2024-01-01",
    )
    vintage = Vintage(
        id=1001,
        year=2018,
        name="Château Margaux Margaux",
        winery="Château Margaux",
        region="Margaux",
        country="France",
        type_id=1,
        grapes=["Cabernet Sauvignon"],
        image_url="https://images.vivino.com/vintage1001.png",
        rating=4.7,
        ratings_count=1200,
        foods=[FoodCategory(id=1, name="Rundvlees", seo_name="beef", weight=1.0)],
        style=None,
        bottles=[bottle1, bottle2],
        start_year=2022,
        end_year=2035,
        window_source="vivino",
    )
    return [
        PairingResult(
            vintage=vintage,
            match_score=0.95,
            window_status="ready",
            explanation="Pairs with Rundvlees",
        )
    ]


@pytest.fixture
def mock_coordinator() -> MagicMock:
    """Mock coordinator fixture."""
    coord = MagicMock()
    coord.data = CellarData(
        cellar_id="651553",
        locale="nl",
        total_count=2,
        vintages=[],
        food_categories=[
            FoodCategory(id=1, name="Rundvlees", seo_name="beef", weight=1.0),
            FoodCategory(id=2, name="Gevogelte", seo_name="poultry", weight=1.0),
        ],
    )
    coord.async_suggest_pairing = AsyncMock(
        return_value=_create_sample_pairing_results()
    )
    return coord


@pytest.mark.asyncio
async def test_intent_registration_and_unregistration(
    mock_coordinator: MagicMock,
) -> None:
    """Test registering and unregistering VivinoCellarSuggestWine intent."""
    hass = MockHass()
    hass.data[DOMAIN] = {"entry_1": mock_coordinator}

    await async_setup_intents(hass)
    assert "intent" in hass.data
    assert INTENT_SUGGEST_WINE in hass.data["intent"]

    await async_unload_intents(hass)
    assert INTENT_SUGGEST_WINE not in hass.data.get("intent", {})


@pytest.mark.asyncio
async def test_intent_suggest_wine_with_dish(mock_coordinator: MagicMock) -> None:
    """Test intent handler with free-text dish slot."""
    hass = MockHass()
    hass.data[DOMAIN] = {"entry_1": mock_coordinator}

    handler = VivinoCellarSuggestWineIntent(hass)
    intent_obj = Intent(
        hass=hass,
        platform="conversation",
        intent_type=INTENT_SUGGEST_WINE,
        slots={"dish": {"value": "Prime rib roast"}},
        language="en",
    )

    response = await handler.async_handle(intent_obj)

    mock_coordinator.async_suggest_pairing.assert_awaited_once_with(
        dish="Prime rib roast",
        food_ids=None,
    )

    speech = response.speech["plain"]["speech"]
    assert "Château Margaux Margaux" in speech
    assert "Wine Fridge" in speech
    assert "A1" in speech


@pytest.mark.asyncio
async def test_intent_suggest_wine_with_food_category_slot(
    mock_coordinator: MagicMock,
) -> None:
    """Test intent handler matching food slot against cellar categories without AI."""
    hass = MockHass()
    hass.data[DOMAIN] = {"entry_1": mock_coordinator}

    handler = VivinoCellarSuggestWineIntent(hass)
    intent_obj = Intent(
        hass=hass,
        platform="conversation",
        intent_type=INTENT_SUGGEST_WINE,
        slots={"food": {"value": "rundvlees"}},
        language="nl",
    )

    response = await handler.async_handle(intent_obj)

    # Should have matched food category ID 1 for rundvlees
    mock_coordinator.async_suggest_pairing.assert_awaited_once_with(
        dish=None,
        food_ids=[1],
    )

    speech = response.speech["plain"]["speech"]
    assert "Château Margaux" in speech
    assert "Wine Fridge" in speech


@pytest.mark.asyncio
async def test_intent_suggest_wine_food_fallback_to_dish(
    mock_coordinator: MagicMock,
) -> None:
    """Test intent handler falls back to dish when food slot does not match known category."""
    hass = MockHass()
    hass.data[DOMAIN] = {"entry_1": mock_coordinator}

    handler = VivinoCellarSuggestWineIntent(hass)
    intent_obj = Intent(
        hass=hass,
        platform="conversation",
        intent_type=INTENT_SUGGEST_WINE,
        slots={"food": {"value": "artichoke dip"}},
        language="en",
    )

    response = await handler.async_handle(intent_obj)

    mock_coordinator.async_suggest_pairing.assert_awaited_once_with(
        dish="artichoke dip",
        food_ids=None,
    )
    speech = response.speech["plain"]["speech"]
    assert "Château Margaux" in speech


@pytest.mark.asyncio
async def test_intent_suggest_wine_no_matches(mock_coordinator: MagicMock) -> None:
    """Test intent handler when no wines match."""
    mock_coordinator.async_suggest_pairing.return_value = []
    hass = MockHass()
    hass.data[DOMAIN] = {"entry_1": mock_coordinator}

    handler = VivinoCellarSuggestWineIntent(hass)
    intent_obj = Intent(
        hass=hass,
        platform="conversation",
        intent_type=INTENT_SUGGEST_WINE,
        slots={"dish": {"value": "Alien Space Dust"}},
        language="en",
    )

    response = await handler.async_handle(intent_obj)
    speech = response.speech["plain"]["speech"]
    assert "couldn't find" in speech.lower() or "no" in speech.lower()


@pytest.mark.asyncio
async def test_intent_suggest_wine_no_slots(mock_coordinator: MagicMock) -> None:
    """Test intent handler when no slots provided."""
    hass = MockHass()
    hass.data[DOMAIN] = {"entry_1": mock_coordinator}

    handler = VivinoCellarSuggestWineIntent(hass)
    intent_obj = Intent(
        hass=hass,
        platform="conversation",
        intent_type=INTENT_SUGGEST_WINE,
        slots={},
        language="en",
    )

    response = await handler.async_handle(intent_obj)
    speech = response.speech["plain"]["speech"]
    assert "specify" in speech.lower() or "provide" in speech.lower()
    mock_coordinator.async_suggest_pairing.assert_not_called()


@pytest.mark.asyncio
async def test_intent_coordinator_error_handled_gracefully(
    mock_coordinator: MagicMock,
) -> None:
    """Test intent handler gracefully returns speech when coordinator raises VivinoError."""
    mock_coordinator.async_suggest_pairing.side_effect = VivinoError(
        "AI pairing unavailable; please select food categories."
    )
    hass = MockHass()
    hass.data[DOMAIN] = {"entry_1": mock_coordinator}

    handler = VivinoCellarSuggestWineIntent(hass)
    intent_obj = Intent(
        hass=hass,
        platform="conversation",
        intent_type=INTENT_SUGGEST_WINE,
        slots={"dish": {"value": "Pizza"}},
        language="en",
    )

    response = await handler.async_handle(intent_obj)
    speech = response.speech["plain"]["speech"]
    assert "AI pairing unavailable" in speech or "unavailable" in speech.lower()


@pytest.mark.asyncio
async def test_intent_dutch_spoken_summary(mock_coordinator: MagicMock) -> None:
    """Test intent handler returns Dutch phrasing when language is Dutch."""
    hass = MockHass()
    hass.data[DOMAIN] = {"entry_1": mock_coordinator}

    handler = VivinoCellarSuggestWineIntent(hass)
    intent_obj = Intent(
        hass=hass,
        platform="conversation",
        intent_type=INTENT_SUGGEST_WINE,
        slots={"dish": {"value": "Biefstuk"}},
        language="nl",
    )

    response = await handler.async_handle(intent_obj)
    speech = response.speech["plain"]["speech"]
    assert "Ik raad" in speech
    assert "flessen" in speech or "fles" in speech
