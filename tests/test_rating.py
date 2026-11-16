"""Tests for rating a wine: coordinator, rate_wine action and WebSocket commands."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.vivino_cellar.const import (
    DOMAIN,
    SERVICE_RATE_WINE,
    WS_TYPE_RATE,
    WS_TYPE_RATING,
)
from custom_components.vivino_cellar.coordinator import VivinoCellarCoordinator
from custom_components.vivino_cellar.exceptions import VivinoError
from custom_components.vivino_cellar.services import (
    ServiceValidationError,
    async_setup_services,
)
from custom_components.vivino_cellar.websocket_api import ws_rate, ws_rating
from tests.test_services import MockHass as ServiceHass
from tests.test_websocket_api import MockConnection
from tests.test_websocket_api import MockHass as WsHass


@pytest.fixture
def coordinator() -> MagicMock:
    coord = MagicMock()
    coord.async_refresh = AsyncMock()
    coord.async_get_rating = AsyncMock(
        return_value={"id": 9, "rating": 4.0, "note": None}
    )
    coord.async_rate_wine = AsyncMock(
        return_value={"id": 9, "rating": 3.5, "note": "Prima"}
    )
    return coord


# --- Coordinator --------------------------------------------------------------


async def test_coordinator_delegates_to_client():
    coord = MagicMock(spec=VivinoCellarCoordinator)
    coord.client = MagicMock()
    coord.client.async_get_rating = AsyncMock(return_value=None)
    coord.client.async_rate_vintage = AsyncMock(return_value={"rating": 4.0})

    assert await VivinoCellarCoordinator.async_get_rating(coord, 5) is None
    result = await VivinoCellarCoordinator.async_rate_wine(coord, 5, 4, "x")
    coord.client.async_rate_vintage.assert_awaited_once_with(5, 4, "x")
    assert result == {"rating": 4.0}


async def test_coordinator_turns_bad_rating_into_vivino_error():
    coord = MagicMock(spec=VivinoCellarCoordinator)
    coord.client = MagicMock()
    coord.client.async_rate_vintage = AsyncMock(side_effect=ValueError("bad"))
    with pytest.raises(VivinoError):
        await VivinoCellarCoordinator.async_rate_wine(coord, 5, 7)


# --- Action -------------------------------------------------------------------


async def test_rate_wine_action(coordinator):
    hass = ServiceHass()
    hass.data[DOMAIN] = {"entry_1": coordinator}
    await async_setup_services(hass)

    response = await hass.services.async_call(
        DOMAIN,
        SERVICE_RATE_WINE,
        {"vintage_id": 1001, "rating": 3.5, "note": "Prima"},
        return_response=True,
    )

    coordinator.async_rate_wine.assert_awaited_once_with(1001, 3.5, "Prima")
    assert response == {"rating": 3.5, "note": "Prima"}


async def test_rate_wine_action_without_note(coordinator):
    hass = ServiceHass()
    hass.data[DOMAIN] = {"entry_1": coordinator}
    await async_setup_services(hass)

    await hass.services.async_call(
        DOMAIN, SERVICE_RATE_WINE, {"vintage_id": 1001, "rating": 4}
    )
    coordinator.async_rate_wine.assert_awaited_once_with(1001, 4.0, None)


@pytest.mark.parametrize("rating", [0, 3.3, 6, "abc"])
async def test_rate_wine_action_rejects_bad_rating(coordinator, rating):
    hass = ServiceHass()
    hass.data[DOMAIN] = {"entry_1": coordinator}
    await async_setup_services(hass)

    with pytest.raises(ServiceValidationError):
        await hass.services.async_call(
            DOMAIN, SERVICE_RATE_WINE, {"vintage_id": 1001, "rating": rating}
        )
    coordinator.async_rate_wine.assert_not_awaited()


# --- WebSocket ----------------------------------------------------------------


async def test_ws_rating_returns_own_rating(coordinator):
    hass = WsHass()
    hass.data[DOMAIN] = {"entry_1": coordinator}
    connection = MockConnection()

    await ws_rating(
        hass, connection, {"id": 1, "type": WS_TYPE_RATING, "vintage_id": 1001}
    )

    coordinator.async_get_rating.assert_awaited_once_with(1001)
    assert connection.results[1] == {"rating": 4.0, "note": None}


async def test_ws_rating_none(coordinator):
    coordinator.async_get_rating.return_value = None
    hass = WsHass()
    hass.data[DOMAIN] = {"entry_1": coordinator}
    connection = MockConnection()

    await ws_rating(
        hass, connection, {"id": 2, "type": WS_TYPE_RATING, "vintage_id": 1001}
    )

    assert connection.results[2] == {"rating": None, "note": None}


async def test_ws_rate(coordinator):
    hass = WsHass()
    hass.data[DOMAIN] = {"entry_1": coordinator}
    connection = MockConnection()

    await ws_rate(
        hass,
        connection,
        {
            "id": 3,
            "type": WS_TYPE_RATE,
            "vintage_id": 1001,
            "rating": 3.5,
            "note": "Prima",
        },
    )

    coordinator.async_rate_wine.assert_awaited_once_with(1001, 3.5, "Prima")
    assert connection.results[3] == {"rating": 3.5, "note": "Prima"}


async def test_ws_rate_error(coordinator):
    coordinator.async_rate_wine.side_effect = VivinoError("Vivino rejected the rating")
    hass = WsHass()
    hass.data[DOMAIN] = {"entry_1": coordinator}
    connection = MockConnection()

    await ws_rate(
        hass,
        connection,
        {"id": 4, "type": WS_TYPE_RATE, "vintage_id": 1001, "rating": 4},
    )

    assert connection.errors[4][0] == "rate_failed"
