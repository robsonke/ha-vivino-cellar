"""Tests for Vivino Cellar DataUpdateCoordinator."""

from __future__ import annotations

import asyncio
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.vivino_cellar.coordinator import VivinoCellarCoordinator
from custom_components.vivino_cellar.exceptions import VivinoError
from custom_components.vivino_cellar.models import (
    Bottle,
    CellarData,
    FoodCategory,
    Vintage,
    WineStyle,
)


def _create_sample_cellar_data() -> CellarData:
    """Create sample cellar data for testing."""
    food1 = FoodCategory(id=1, name="Beef", seo_name="beef", weight=0.8)
    food2 = FoodCategory(id=2, name="Lamb", seo_name="lamb", weight=0.6)

    bottle1 = Bottle(
        id=101,
        size_id=1,
        storage_location_id=1,
        location_name="Rack A",
        bin="1",
        created_at="2024-01-01",
    )
    bottle2 = Bottle(
        id=102,
        size_id=1,
        storage_location_id=1,
        location_name="Rack A",
        bin="2",
        created_at="2024-01-01",
    )

    vintage1 = Vintage(
        id=1001,
        year=2018,
        name="Chateau Margaux 2018",
        winery="Chateau Margaux",
        region="Bordeaux",
        country="France",
        type_id=1,
        grapes=["Cabernet Sauvignon"],
        image_url="https://example.com/1.png",
        rating=4.6,
        ratings_count=1200,
        foods=[food1],
        style=WineStyle(name="Bordeaux Red", body=4.0, acidity=3.5, food=["Beef"]),
        bottles=[bottle1],
        start_year=2020,
        end_year=2028,
        window_source="vivino",
    )

    vintage2 = Vintage(
        id=1002,
        year=2021,
        name="Unknown Window Wine 2021",
        winery="Mystery Cellars",
        region="Rioja",
        country="Spain",
        type_id=1,
        grapes=["Tempranillo"],
        image_url=None,
        rating=4.2,
        ratings_count=150,
        foods=[food2],
        style=None,
        bottles=[bottle2],
        start_year=None,
        end_year=None,
        window_source="none",
    )

    return CellarData(
        cellar_id="12345",
        locale="en",
        total_count=2,
        vintages=[vintage1, vintage2],
        food_categories=[food1, food2],
    )


class MockServices:
    """Mock Home Assistant service registry."""

    def __init__(self) -> None:
        self.async_call = AsyncMock()


class MockHass:
    """Mock Home Assistant core instance."""

    def __init__(self) -> None:
        self.services = MockServices()

    def async_create_task(self, target):
        return asyncio.create_task(target)


@pytest.fixture
def mock_hass() -> MockHass:
    return MockHass()


@pytest.fixture
def mock_client() -> MagicMock:
    client = MagicMock()
    client.cellar_id = "12345"
    client.locale = "en"
    client.async_fetch_cellar = AsyncMock(return_value=_create_sample_cellar_data())
    client.async_remove_bottle = AsyncMock(return_value=True)
    return client


async def test_coordinator_init(mock_hass: MockHass, mock_client: MagicMock) -> None:
    """Test coordinator initialization and 6-hour polling schedule."""
    coordinator = VivinoCellarCoordinator(
        mock_hass,
        mock_client,
        ai_task_entity="conversation.wine_expert",
    )
    assert coordinator.update_interval == timedelta(hours=6)
    assert coordinator.client == mock_client
    assert coordinator.ai_task_entity == "conversation.wine_expert"
    assert coordinator.last_refresh_time is None


async def test_coordinator_fetch_and_merge_stored_ai_windows(
    mock_hass: MockHass, mock_client: MagicMock
) -> None:
    """Test refresh merges existing stored AI estimates for vintages lacking Vivino windows."""
    coordinator = VivinoCellarCoordinator(
        mock_hass,
        mock_client,
        ai_task_entity=None,
    )

    # Pre-populate store with an estimate for vintage 1002
    await coordinator._store.async_save(
        {"1002": {"start_year": 2024, "end_year": 2029, "confidence": 0.85}}
    )

    await coordinator.async_refresh()

    assert coordinator.data is not None
    assert isinstance(coordinator.last_refresh_time, datetime)

    v1 = next(v for v in coordinator.data.vintages if v.id == 1001)
    v2 = next(v for v in coordinator.data.vintages if v.id == 1002)

    # Vintage 1 retained its Vivino window
    assert v1.start_year == 2020
    assert v1.end_year == 2028
    assert v1.window_source == "vivino"

    # Vintage 2 had AI estimate merged from store
    assert v2.start_year == 2024
    assert v2.end_year == 2029
    assert v2.window_source == "ai_estimate"


async def test_coordinator_background_ai_window_estimation(
    mock_hass: MockHass, mock_client: MagicMock
) -> None:
    """Test background AI window estimation for vintages with no window."""
    mock_hass.services.async_call.return_value = {
        "data": {
            "start_year": 2025,
            "end_year": 2031,
            "confidence": 0.9,
        }
    }

    coordinator = VivinoCellarCoordinator(
        mock_hass,
        mock_client,
        ai_task_entity="conversation.wine_expert",
    )

    await coordinator.async_refresh()
    # Wait for the background estimation task
    await coordinator.async_wait_ai_estimation()

    # Verify AI Task service was called
    mock_hass.services.async_call.assert_called()
    call_args = mock_hass.services.async_call.call_args
    assert call_args[0][0] == "ai_task"
    assert call_args[0][1] == "generate_data"
    service_data = call_args[0][2]
    assert service_data["entity_id"] == "conversation.wine_expert"

    # Verify vintage 1002 now has estimated window
    v2 = next(v for v in coordinator.data.vintages if v.id == 1002)
    assert v2.start_year == 2025
    assert v2.end_year == 2031
    assert v2.window_source == "ai_estimate"

    # Verify estimate was saved in store
    stored = await coordinator._store.async_load()
    assert stored is not None
    assert str(v2.id) in stored or v2.id in stored


async def test_coordinator_background_ai_skipped_when_no_ai_entity(
    mock_hass: MockHass, mock_client: MagicMock
) -> None:
    """Test that background AI estimation is skipped if no AI task entity is configured."""
    coordinator = VivinoCellarCoordinator(
        mock_hass,
        mock_client,
        ai_task_entity=None,
    )

    await coordinator.async_refresh()
    await coordinator.async_wait_ai_estimation()

    mock_hass.services.async_call.assert_not_called()
    v2 = next(v for v in coordinator.data.vintages if v.id == 1002)
    assert v2.start_year is None
    assert v2.window_source == "none"


async def test_async_suggest_pairing_with_food_ids(
    mock_hass: MockHass, mock_client: MagicMock
) -> None:
    """Test pairing suggestion with direct food category IDs (bypassing AI)."""
    coordinator = VivinoCellarCoordinator(
        mock_hass,
        mock_client,
        ai_task_entity="conversation.wine_expert",
    )
    await coordinator.async_refresh()

    results = await coordinator.async_suggest_pairing(food_ids=[1])

    # No AI call should have been made
    mock_hass.services.async_call.assert_not_called()
    assert len(results) > 0
    assert results[0].vintage.id == 1001


async def test_async_suggest_pairing_with_dish_ai_success(
    mock_hass: MockHass, mock_client: MagicMock
) -> None:
    """Test pairing suggestion with free-text dish using AI Task."""
    mock_hass.services.async_call.return_value = {
        "data": [
            {"food_id": 1, "weight": 0.95},
        ]
    }

    coordinator = VivinoCellarCoordinator(
        mock_hass,
        mock_client,
        ai_task_entity="conversation.wine_expert",
    )
    await coordinator.async_refresh()

    results = await coordinator.async_suggest_pairing(dish="Prime rib roast")

    mock_hass.services.async_call.assert_called_once()
    call_args = mock_hass.services.async_call.call_args
    assert call_args[0][0] == "ai_task"
    assert call_args[0][1] == "generate_data"
    service_data = call_args[0][2]
    assert service_data["entity_id"] == "conversation.wine_expert"
    assert "Prime rib roast" in service_data["task"]

    assert len(results) > 0
    assert results[0].vintage.id == 1001


async def test_async_suggest_pairing_no_ai_entity_raises(
    mock_hass: MockHass, mock_client: MagicMock
) -> None:
    """Test that free-text dish pairing raises VivinoError if no AI entity is configured."""
    coordinator = VivinoCellarCoordinator(
        mock_hass,
        mock_client,
        ai_task_entity=None,
    )
    await coordinator.async_refresh()

    with pytest.raises(VivinoError, match="AI pairing unavailable"):
        await coordinator.async_suggest_pairing(dish="Prime rib roast")


async def test_async_suggest_pairing_ai_call_fails_raises(
    mock_hass: MockHass, mock_client: MagicMock
) -> None:
    """Test that free-text dish pairing raises VivinoError if AI Task service call fails."""
    mock_hass.services.async_call.side_effect = RuntimeError("LLM service unavailable")

    coordinator = VivinoCellarCoordinator(
        mock_hass,
        mock_client,
        ai_task_entity="conversation.wine_expert",
    )
    await coordinator.async_refresh()

    with pytest.raises(VivinoError, match="AI pairing unavailable"):
        await coordinator.async_suggest_pairing(dish="Prime rib roast")


async def test_async_drink_bottle(mock_hass: MockHass, mock_client: MagicMock) -> None:
    """Test drinking a bottle invokes client write and triggers refresh."""
    coordinator = VivinoCellarCoordinator(
        mock_hass,
        mock_client,
        ai_task_entity=None,
    )
    await coordinator.async_refresh()
    assert mock_client.async_fetch_cellar.call_count == 1

    await coordinator.async_drink_bottle(bottle_id=101, vintage_id=1001)

    mock_client.async_remove_bottle.assert_called_once_with(101, vintage_id=1001)
    # Refresh should have been called again
    assert mock_client.async_fetch_cellar.call_count == 2


async def test_coordinator_fetch_error_raises_update_failed(
    mock_hass: MockHass, mock_client: MagicMock
) -> None:
    """Test coordinator raises UpdateFailed on client fetch failure."""
    from custom_components.vivino_cellar.coordinator import UpdateFailed

    mock_client.async_fetch_cellar.side_effect = RuntimeError("Network error")

    coordinator = VivinoCellarCoordinator(
        mock_hass,
        mock_client,
        ai_task_entity=None,
    )

    with pytest.raises(UpdateFailed, match="Error fetching cellar data"):
        await coordinator.async_refresh()


async def test_coordinator_auth_error_raises_config_entry_auth_failed(
    mock_hass: MockHass, mock_client: MagicMock
) -> None:
    """Test coordinator raises ConfigEntryAuthFailed when VivinoAuthError is raised."""
    from custom_components.vivino_cellar.coordinator import ConfigEntryAuthFailed
    from custom_components.vivino_cellar.exceptions import VivinoAuthError

    mock_client.async_fetch_cellar.side_effect = VivinoAuthError("Session expired")

    coordinator = VivinoCellarCoordinator(
        mock_hass,
        mock_client,
        ai_task_entity=None,
    )

    with pytest.raises(
        ConfigEntryAuthFailed,
        match="Vivino authentication failed or session expired",
    ):
        await coordinator._async_update_data()


async def test_async_drink_bottle_failure_raises(
    mock_hass: MockHass, mock_client: MagicMock
) -> None:
    """Test async_drink_bottle raises VivinoError when client returns False."""
    mock_client.async_remove_bottle.return_value = False

    coordinator = VivinoCellarCoordinator(
        mock_hass,
        mock_client,
        ai_task_entity=None,
    )
    await coordinator.async_refresh()

    with pytest.raises(VivinoError, match="Failed to remove bottle"):
        await coordinator.async_drink_bottle(bottle_id=999)


async def test_async_suggest_pairing_empty_inputs_returns_empty(
    mock_hass: MockHass, mock_client: MagicMock
) -> None:
    """Test that empty inputs or no data return empty pairing results."""
    coordinator = VivinoCellarCoordinator(
        mock_hass,
        mock_client,
        ai_task_entity="conversation.wine_expert",
    )
    # When data is None
    assert await coordinator.async_suggest_pairing(dish=None, food_ids=None) == []

    await coordinator.async_refresh()
    # When dish and food_ids are None/empty
    assert await coordinator.async_suggest_pairing(dish=None, food_ids=None) == []
    assert await coordinator.async_suggest_pairing(dish="", food_ids=[]) == []


async def test_async_suggest_pairing_ai_returns_empty(
    mock_hass: MockHass, mock_client: MagicMock
) -> None:
    """Test pairing suggestion when AI returns empty matches."""
    mock_hass.services.async_call.return_value = {"data": []}

    coordinator = VivinoCellarCoordinator(
        mock_hass,
        mock_client,
        ai_task_entity="conversation.wine_expert",
    )
    await coordinator.async_refresh()

    results = await coordinator.async_suggest_pairing(dish="Alien Space Food")
    assert results == []


async def test_background_ai_estimation_handles_service_error(
    mock_hass: MockHass, mock_client: MagicMock
) -> None:
    """Test that background AI estimation catches service errors and continues without crash."""
    mock_hass.services.async_call.side_effect = RuntimeError("LLM error")

    coordinator = VivinoCellarCoordinator(
        mock_hass,
        mock_client,
        ai_task_entity="conversation.wine_expert",
    )
    await coordinator.async_refresh()
    await coordinator.async_wait_ai_estimation()

    v2 = next(v for v in coordinator.data.vintages if v.id == 1002)
    assert v2.start_year is None
    assert v2.window_source == "none"

