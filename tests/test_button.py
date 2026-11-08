"""Tests for Vivino Cellar button platform."""

from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.vivino_cellar.button import (
    BUTTON_TYPES,
    VivinoRefreshButton,
    async_setup_entry as async_setup_button_entry,
)
from custom_components.vivino_cellar.const import CONF_CELLAR_URL, CONF_COOKIE, DOMAIN


class MockConfigEntry:
    """Mock config entry."""

    def __init__(
        self,
        entry_id: str = "test_entry_id",
        unique_id: str = "651553",
        data: dict | None = None,
    ) -> None:
        self.entry_id = entry_id
        self.unique_id = unique_id
        self.data = data or {
            CONF_CELLAR_URL: "https://www.vivino.com/nl/cellars/651553",
            CONF_COOKIE: "_ruby-web_session=mock_cookie_123",
        }
        self.title = "Vivino Cellar 651553"


class MockHass:
    """Mock HomeAssistant object."""

    def __init__(self) -> None:
        self.data: dict = {}


@pytest.fixture
def mock_coordinator() -> MagicMock:
    """Fixture providing a mock coordinator."""
    coord = MagicMock()
    coord.client = MagicMock()
    coord.client.cellar_id = "651553"
    coord.last_refresh_time = None
    coord.last_update_success_time = None
    coord.async_refresh = AsyncMock()
    coord.async_add_listener = MagicMock(return_value=lambda: None)
    return coord


@pytest.mark.asyncio
async def test_button_setup_entry(mock_coordinator: MagicMock) -> None:
    """Test button platform setup adds VivinoRefreshButton."""
    hass = MockHass()
    entry = MockConfigEntry()
    hass.data[DOMAIN] = {entry.entry_id: mock_coordinator}

    added_entities: list[VivinoRefreshButton] = []

    def async_add_entities(entities: list[VivinoRefreshButton]) -> None:
        added_entities.extend(entities)

    await async_setup_button_entry(hass, entry, async_add_entities)

    assert len(added_entities) == 1
    assert added_entities[0].entity_description.key == "refresh_cellar"


@pytest.mark.asyncio
async def test_button_press_calls_async_refresh(mock_coordinator: MagicMock) -> None:
    """Test pressing button triggers coordinator async_refresh when not throttled."""
    entry = MockConfigEntry()
    button = VivinoRefreshButton(mock_coordinator, entry, BUTTON_TYPES[0])

    await button.async_press()
    mock_coordinator.async_refresh.assert_awaited_once()


@pytest.mark.asyncio
async def test_button_throttles_within_30s_of_last_refresh(
    mock_coordinator: MagicMock, caplog: pytest.LogCaptureFixture
) -> None:
    """Test button ignores press if coordinator refreshed within 30 seconds."""
    entry = MockConfigEntry()
    button = VivinoRefreshButton(mock_coordinator, entry, BUTTON_TYPES[0])

    # Simulate coordinator refreshed 10 seconds ago
    mock_coordinator.last_refresh_time = datetime.now(UTC) - timedelta(seconds=10)

    with caplog.at_level(logging.INFO):
        await button.async_press()

    mock_coordinator.async_refresh.assert_not_called()
    assert any("Refresh ignored" in record.message for record in caplog.records)


@pytest.mark.asyncio
async def test_button_throttles_within_30s_of_last_press(
    mock_coordinator: MagicMock, caplog: pytest.LogCaptureFixture
) -> None:
    """Test button ignores press if previously pressed within 30 seconds."""
    entry = MockConfigEntry()
    button = VivinoRefreshButton(mock_coordinator, entry, BUTTON_TYPES[0])

    # First press should succeed
    await button.async_press()
    assert mock_coordinator.async_refresh.await_count == 1

    # Second press immediately after should be throttled
    caplog.clear()
    with caplog.at_level(logging.INFO):
        await button.async_press()

    assert mock_coordinator.async_refresh.await_count == 1
    assert any("Refresh ignored" in record.message for record in caplog.records)


@pytest.mark.asyncio
async def test_button_allows_press_after_30s(mock_coordinator: MagicMock) -> None:
    """Test button allows press when more than 30 seconds have passed."""
    entry = MockConfigEntry()
    button = VivinoRefreshButton(mock_coordinator, entry, BUTTON_TYPES[0])

    # Coordinator refreshed 35 seconds ago
    mock_coordinator.last_refresh_time = datetime.now(UTC) - timedelta(seconds=35)
    # Simulate button pressed 40 seconds ago
    button._last_press_time = datetime.now(UTC) - timedelta(seconds=40)

    await button.async_press()
    mock_coordinator.async_refresh.assert_awaited_once()


def test_button_metadata(mock_coordinator: MagicMock) -> None:
    """Test button unique_id and device_info."""
    entry = MockConfigEntry()
    button = VivinoRefreshButton(mock_coordinator, entry, BUTTON_TYPES[0])

    assert button.unique_id == f"{entry.unique_id}_{BUTTON_TYPES[0].key}"
    assert button.has_entity_name is True
    device_info = button.device_info
    assert (DOMAIN, "651553") in device_info.identifiers
    assert device_info.manufacturer == "Vivino"
