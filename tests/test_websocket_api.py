"""Tests for Vivino Cellar WebSocket API endpoints."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.vivino_cellar.const import (
    DOMAIN,
    WS_TYPE_CELLAR,
    WS_TYPE_DRINK,
    WS_TYPE_PAIRING,
    WS_TYPE_REFRESH,
    WS_TYPE_SUBSCRIBE,
)
from custom_components.vivino_cellar.exceptions import VivinoError
from custom_components.vivino_cellar.models import (
    Bottle,
    CellarData,
    FoodCategory,
    Vintage,
)
from custom_components.vivino_cellar.pairing import PairingResult
from custom_components.vivino_cellar.websocket_api import (
    async_setup_websocket_api,
    async_unload_websocket_api,
    ws_cellar,
    ws_drink,
    ws_pairing,
    ws_refresh,
    ws_subscribe,
)


class MockConnection:
    """Mock HomeAssistant ActiveConnection."""

    def __init__(self, is_admin: bool = False) -> None:
        self.user = MagicMock()
        self.user.is_admin = is_admin
        self.results: dict[int, Any] = {}
        self.errors: dict[int, tuple[str, str]] = {}
        self.messages: list[dict[str, Any]] = []
        self.subscriptions: dict[int, Any] = {}

    def send_message(self, message: dict[str, Any]) -> None:
        self.messages.append(message)

    def send_result(self, msg_id: int, result: Any = None) -> None:
        self.results[msg_id] = result

    def send_error(self, msg_id: int, code: str, message: str) -> None:
        self.errors[msg_id] = (code, message)


class MockHass:
    """Mock HomeAssistant."""

    def __init__(self) -> None:
        self.data: dict[str, Any] = {}


def _create_sample_cellar_data() -> CellarData:
    """Create sample cellar data for testing."""
    b1 = Bottle(
        id=101,
        size_id=1,
        storage_location_id=10,
        location_name="Wine Fridge",
        bin="A1",
        created_at="2024-01-01",
    )
    b2 = Bottle(
        id=102,
        size_id=1,
        storage_location_id=10,
        location_name="Wine Fridge",
        bin="A2",
        created_at="2024-01-01",
    )
    b3 = Bottle(
        id=103,
        size_id=1,
        storage_location_id=20,
        location_name="Basement",
        bin="B1",
        created_at="2024-01-02",
    )
    b4 = Bottle(
        id=104,
        size_id=1,
        storage_location_id=20,
        location_name="Basement",
        bin=None,
        created_at="2024-01-03",
    )

    food_beef = FoodCategory(id=1, name="Beef", seo_name="beef", weight=1.0)
    food_cheese = FoodCategory(id=2, name="Hard Cheese", seo_name="cheese", weight=0.8)

    # Ready wine (current year 2026: 2022 <= 2026 < 2035)
    v1 = Vintage(
        id=1001,
        wine_id=501,
        year=2018,
        name="Château Margaux",
        winery="Château Margaux",
        region="Margaux",
        country="France",
        type_id=1,
        grapes=["Cabernet Sauvignon"],
        image_url="https://images.vivino.com/v1001.png",
        rating=4.7,
        ratings_count=1200,
        foods=[food_beef],
        style=None,
        bottles=[b1, b2],
        start_year=2022,
        end_year=2029,  # ends within CAN_WAIT_YEARS of 2026, so ready
        window_source="vivino",
    )

    # Hold wine (2028 > 2026)
    v2 = Vintage(
        id=1002,
        year=2021,
        name="Barolo Riserva",
        winery="Giacomo Conterno",
        region="Piedmont",
        country="Italy",
        type_id=1,
        grapes=["Nebbiolo"],
        image_url="https://images.vivino.com/v1002.png",
        rating=4.8,
        ratings_count=850,
        foods=[food_beef, food_cheese],
        style=None,
        bottles=[b3],
        start_year=2028,
        end_year=2045,
        window_source="ai_estimate",
    )

    # Near past peak wine (end_year == 2026)
    v3 = Vintage(
        id=1003,
        year=2015,
        name="Bourgogne Pinot Noir",
        winery="Domaine Dujac",
        region="Burgundy",
        country="France",
        type_id=1,
        grapes=["Pinot Noir"],
        image_url=None,
        rating=4.1,
        ratings_count=300,
        foods=[food_cheese],
        style=None,
        bottles=[b4],
        start_year=2018,
        end_year=2026,
        window_source="vivino",
    )

    return CellarData(
        cellar_id="651553",
        locale="nl",
        total_count=4,
        vintages=[v1, v2, v3],
        food_categories=[food_beef, food_cheese],
    )


@pytest.fixture
def mock_coordinator() -> MagicMock:
    """Create a mock VivinoCellarCoordinator."""
    coord = MagicMock()
    coord.data = _create_sample_cellar_data()
    coord.last_refresh_time = datetime(2026, 11, 8, 12, 0, 0, tzinfo=UTC)
    coord.async_drink_bottle = AsyncMock()
    coord.async_refresh = AsyncMock()

    pairing_res = [
        PairingResult(
            vintage=coord.data.vintages[0],
            match_score=0.95,
            window_status="ready",
            explanation="Excellent match with grilled ribeye beef.",
        )
    ]
    coord.async_suggest_pairing = AsyncMock(return_value=pairing_res)
    return coord


@pytest.mark.asyncio
async def test_websocket_registration_and_unregistration() -> None:
    """Test registering and unregistering all 4 websocket commands."""
    hass = MockHass()
    await async_setup_websocket_api(hass)

    commands = hass.data.get("websocket_api", {}).get("commands", {})
    assert WS_TYPE_CELLAR in commands
    assert WS_TYPE_PAIRING in commands
    assert WS_TYPE_DRINK in commands
    assert WS_TYPE_REFRESH in commands
    assert WS_TYPE_SUBSCRIBE in commands

    # Unload
    await async_unload_websocket_api(hass)
    commands_after = hass.data.get("websocket_api", {}).get("commands", {})
    assert WS_TYPE_CELLAR not in commands_after
    assert WS_TYPE_PAIRING not in commands_after
    assert WS_TYPE_DRINK not in commands_after
    assert WS_TYPE_REFRESH not in commands_after
    assert WS_TYPE_SUBSCRIBE not in commands_after


def test_commands_do_not_require_admin() -> None:
    """Verify Rob's explicit decision: WS commands must NOT require admin."""
    handlers = [ws_cellar, ws_pairing, ws_drink, ws_refresh]
    for handler in handlers:
        # None of the handlers should have _ws_require_admin flag set to True
        assert getattr(handler, "_ws_require_admin", False) is False


@pytest.mark.asyncio
async def test_ws_cellar_overview(mock_coordinator: MagicMock) -> None:
    """Test vivino_cellar/cellar returns grouped wines, food categories, and refresh time."""
    hass = MockHass()
    hass.data[DOMAIN] = {"entry_1": mock_coordinator}

    connection = MockConnection(is_admin=False)  # Non-admin user
    msg = {"id": 1, "type": WS_TYPE_CELLAR}

    await ws_cellar(hass, connection, msg)

    assert 1 in connection.results
    res = connection.results[1]

    assert res["cellar_id"] == "651553"
    assert res["total_bottles"] == 4
    assert res["last_refresh_time"] == "2026-11-08T12:00:00+00:00"

    # Food categories check
    assert len(res["food_categories"]) == 2
    assert res["food_categories"][0]["name"] == "Beef"
    assert res["food_categories"][0]["id"] == 1

    # Wines list check
    wines = res["wines"]
    assert len(wines) == 3

    margaux = next(w for w in wines if w["vintage_id"] == 1001)
    assert margaux["name"] == "Château Margaux"
    assert margaux["winery"] == "Château Margaux"
    assert margaux["year"] == 2018
    assert margaux["window_source"] == "vivino"
    assert margaux["window_status"] == "ready"
    # Kelder tab filters on grape and style.
    assert margaux["grapes"] == ["Cabernet Sauvignon"]
    assert margaux["vivino_url"] == "https://www.vivino.com/w/501?year=2018"
    # No wine id from Vivino: no link.
    other = next(w for w in wines if w["vintage_id"] == 1002)
    assert other["vivino_url"] is None
    assert margaux["style"] is None
    assert len(margaux["bottles"]) == 2
    assert margaux["bottles"][0]["location_name"] == "Wine Fridge"
    assert margaux["bottles"][0]["bin"] == "A1"

    # Grouped wines check
    grouped = res["grouped_wines"]
    assert "ready" in grouped
    assert "hold" in grouped
    assert "near_past_peak" in grouped
    assert len(grouped["ready"]) == 1
    assert grouped["ready"][0]["vintage_id"] == 1001
    assert len(grouped["hold"]) == 1
    assert grouped["hold"][0]["vintage_id"] == 1002
    assert len(grouped["near_past_peak"]) == 1
    assert grouped["near_past_peak"][0]["vintage_id"] == 1003


@pytest.mark.asyncio
async def test_ws_cellar_empty_data() -> None:
    """Test vivino_cellar/cellar when coordinator has no data."""
    hass = MockHass()
    coord = MagicMock()
    coord.data = None
    coord.last_refresh_time = None
    hass.data[DOMAIN] = {"entry_1": coord}

    connection = MockConnection(is_admin=False)
    msg = {"id": 1, "type": WS_TYPE_CELLAR}

    await ws_cellar(hass, connection, msg)

    assert 1 in connection.results
    res = connection.results[1]
    assert res["wines"] == []
    assert res["food_categories"] == []
    assert res["total_bottles"] == 0
    assert res["last_refresh_time"] is None


@pytest.mark.asyncio
async def test_ws_cellar_not_configured() -> None:
    """Test vivino_cellar/cellar returns error if integration is not configured."""
    hass = MockHass()
    connection = MockConnection(is_admin=False)
    msg = {"id": 1, "type": WS_TYPE_CELLAR}

    await ws_cellar(hass, connection, msg)

    assert 1 in connection.errors
    code, err_msg = connection.errors[1]
    assert code == "not_found"
    assert "not configured" in err_msg


@pytest.mark.asyncio
async def test_ws_pairing_with_dish(mock_coordinator: MagicMock) -> None:
    """Test vivino_cellar/pairing with dish input returns ranked results."""
    hass = MockHass()
    hass.data[DOMAIN] = {"entry_1": mock_coordinator}

    connection = MockConnection(is_admin=False)
    msg = {"id": 10, "type": WS_TYPE_PAIRING, "dish": "Grilled ribeye steak"}

    await ws_pairing(hass, connection, msg)

    mock_coordinator.async_suggest_pairing.assert_awaited_once_with(
        dish="Grilled ribeye steak",
        food_ids=None,
    )

    assert 10 in connection.results
    res = connection.results[10]
    assert "matches" in res
    assert len(res["matches"]) == 1
    match = res["matches"][0]
    assert match["vintage_id"] == 1001
    assert match["match_score"] == 0.95
    assert match["window_status"] == "ready"
    assert match["explanation"] == "Excellent match with grilled ribeye beef."
    assert len(match["bottles"]) == 2
    assert match["bottles"][0]["bottle_id"] == 101


@pytest.mark.asyncio
async def test_ws_pairing_with_food_ids(mock_coordinator: MagicMock) -> None:
    """Test vivino_cellar/pairing with food_ids input."""
    hass = MockHass()
    hass.data[DOMAIN] = {"entry_1": mock_coordinator}

    connection = MockConnection(is_admin=False)
    msg = {"id": 11, "type": WS_TYPE_PAIRING, "food_ids": [1, 2]}

    await ws_pairing(hass, connection, msg)

    mock_coordinator.async_suggest_pairing.assert_awaited_once_with(
        dish=None,
        food_ids=[1, 2],
    )
    assert 11 in connection.results


@pytest.mark.asyncio
async def test_ws_pairing_validation_errors(mock_coordinator: MagicMock) -> None:
    """Test vivino_cellar/pairing validates that exactly one of dish or food_ids is provided."""
    hass = MockHass()
    hass.data[DOMAIN] = {"entry_1": mock_coordinator}

    connection = MockConnection(is_admin=False)

    # Neither provided
    await ws_pairing(hass, connection, {"id": 20, "type": WS_TYPE_PAIRING})
    assert 20 in connection.errors
    assert connection.errors[20][0] == "invalid_format"

    # Both provided
    await ws_pairing(
        hass,
        connection,
        {"id": 21, "type": WS_TYPE_PAIRING, "dish": "Steak", "food_ids": [1]},
    )
    assert 21 in connection.errors
    assert connection.errors[21][0] == "invalid_format"


@pytest.mark.asyncio
async def test_ws_pairing_vivino_error(mock_coordinator: MagicMock) -> None:
    """Test vivino_cellar/pairing handles VivinoError gracefully."""
    mock_coordinator.async_suggest_pairing.side_effect = VivinoError(
        "AI pairing unavailable; please select food categories."
    )
    hass = MockHass()
    hass.data[DOMAIN] = {"entry_1": mock_coordinator}

    connection = MockConnection(is_admin=False)
    msg = {"id": 22, "type": WS_TYPE_PAIRING, "dish": "Duck breast"}

    await ws_pairing(hass, connection, msg)

    assert 22 in connection.errors
    code, err_msg = connection.errors[22]
    assert code == "pairing_failed"
    assert "AI pairing unavailable" in err_msg


@pytest.mark.asyncio
async def test_ws_drink_bottle(mock_coordinator: MagicMock) -> None:
    """Test vivino_cellar/drink invokes drink bottle and triggers coordinator."""
    hass = MockHass()
    hass.data[DOMAIN] = {"entry_1": mock_coordinator}

    connection = MockConnection(is_admin=False)
    msg = {
        "id": 30,
        "type": WS_TYPE_DRINK,
        "bottle_id": 101,
        "vintage_id": 1001,
    }

    await ws_drink(hass, connection, msg)

    mock_coordinator.async_drink_bottle.assert_awaited_once_with(
        bottle_id=101,
        vintage_id=1001,
    )
    assert 30 in connection.results
    assert connection.results[30] == {"success": True}


@pytest.mark.asyncio
async def test_ws_drink_bottle_missing_id(mock_coordinator: MagicMock) -> None:
    """Test vivino_cellar/drink requires bottle_id."""
    hass = MockHass()
    hass.data[DOMAIN] = {"entry_1": mock_coordinator}

    connection = MockConnection(is_admin=False)
    msg = {"id": 31, "type": WS_TYPE_DRINK}

    await ws_drink(hass, connection, msg)

    assert 31 in connection.errors
    assert connection.errors[31][0] == "invalid_format"


@pytest.mark.asyncio
async def test_ws_drink_bottle_error(mock_coordinator: MagicMock) -> None:
    """Test vivino_cellar/drink reports failure on VivinoError."""
    mock_coordinator.async_drink_bottle.side_effect = VivinoError(
        "Failed to remove bottle from Vivino"
    )
    hass = MockHass()
    hass.data[DOMAIN] = {"entry_1": mock_coordinator}

    connection = MockConnection(is_admin=False)
    msg = {"id": 32, "type": WS_TYPE_DRINK, "bottle_id": 999}

    await ws_drink(hass, connection, msg)

    assert 32 in connection.errors
    assert connection.errors[32][0] == "drink_failed"


@pytest.mark.asyncio
async def test_ws_refresh(mock_coordinator: MagicMock) -> None:
    """Test vivino_cellar/refresh triggers coordinator refresh."""
    hass = MockHass()
    hass.data[DOMAIN] = {"entry_1": mock_coordinator}

    connection = MockConnection(is_admin=False)
    msg = {"id": 40, "type": WS_TYPE_REFRESH}

    await ws_refresh(hass, connection, msg)

    mock_coordinator.async_refresh.assert_awaited_once()
    assert 40 in connection.results
    assert connection.results[40] == {"success": True}


@pytest.mark.asyncio
async def test_ws_specific_entry_id(mock_coordinator: MagicMock) -> None:
    """Test commands can target a specific config entry via entry_id."""
    coord2 = MagicMock()
    coord2.async_refresh = AsyncMock()

    hass = MockHass()
    hass.data[DOMAIN] = {
        "entry_1": mock_coordinator,
        "entry_2": coord2,
    }

    connection = MockConnection(is_admin=False)
    msg = {"id": 50, "type": WS_TYPE_REFRESH, "entry_id": "entry_2"}

    await ws_refresh(hass, connection, msg)

    coord2.async_refresh.assert_awaited_once()
    mock_coordinator.async_refresh.assert_not_called()


@pytest.mark.asyncio
async def test_entry_lifecycle_registers_and_unloads_websocket_api() -> None:
    """Test __init__.py async_setup_entry and async_unload_entry lifecycle for WS API."""
    from unittest.mock import patch

    from custom_components.vivino_cellar import async_setup_entry, async_unload_entry
    from custom_components.vivino_cellar.const import CONF_CELLAR_URL, CONF_COOKIE

    class TestEntry:
        def __init__(self, entry_id: str = "entry_test") -> None:
            self.entry_id = entry_id
            self.unique_id = "651553"
            self.data = {
                CONF_CELLAR_URL: "https://www.vivino.com/nl/cellars/651553",
                CONF_COOKIE: "_ruby-web_session=mock_cookie_123",
            }
            self.options = {}

        def async_on_unload(self, callback: any) -> None:
            pass

    hass = MockHass()
    hass.client_session = MagicMock()
    hass.config_entries = MagicMock()
    hass.config_entries.async_update_entry = MagicMock()
    hass.config_entries.async_forward_entry_setups = AsyncMock(return_value=True)
    hass.config_entries.async_unload_platforms = AsyncMock(return_value=True)

    entry = TestEntry()

    mock_client = MagicMock()
    mock_client.cellar_id = "651553"
    mock_client.get_rotated_cookie.return_value = None
    mock_client.async_fetch_cellar = AsyncMock(return_value=MagicMock(vintages=[]))

    with (
        patch("custom_components.vivino_cellar.VivinoClient", return_value=mock_client),
        patch(
            "custom_components.vivino_cellar.coordinator.Store.async_load",
            new_callable=AsyncMock,
            return_value=None,
        ),
    ):
        setup_ok = await async_setup_entry(hass, entry)
        assert setup_ok is True

        ws_commands = hass.data.get("websocket_api", {}).get("commands", {})
        assert WS_TYPE_CELLAR in ws_commands
        assert WS_TYPE_PAIRING in ws_commands
        assert WS_TYPE_DRINK in ws_commands
        assert WS_TYPE_REFRESH in ws_commands

        unload_ok = await async_unload_entry(hass, entry)
        assert unload_ok is True

        ws_commands_after = hass.data.get("websocket_api", {}).get("commands", {})
        assert WS_TYPE_CELLAR not in ws_commands_after
        assert WS_TYPE_PAIRING not in ws_commands_after
        assert WS_TYPE_DRINK not in ws_commands_after
        assert WS_TYPE_REFRESH not in ws_commands_after


def test_ws_subscribe_pushes_now_and_on_update(mock_coordinator: MagicMock) -> None:
    """Subscribe sends the cellar payload at once and after each coordinator update."""
    listeners: list[Any] = []
    unsub = MagicMock()

    def _add_listener(cb: Any) -> Any:
        listeners.append(cb)
        return unsub

    mock_coordinator.async_add_listener = _add_listener
    mock_coordinator.last_update_success = True
    hass = MockHass()
    hass.data[DOMAIN] = {"entry_1": mock_coordinator}
    connection = MockConnection()

    ws_subscribe(hass, connection, {"id": 7, "type": WS_TYPE_SUBSCRIBE})

    assert 7 in connection.results
    assert len(connection.messages) == 1
    first = connection.messages[0]
    assert first["id"] == 7 and first["type"] == "event"
    assert first["event"]["total_bottles"] == 4
    assert first["event"]["last_update_success"] is True

    # Coordinator update (e.g. a drink or AI estimate) pushes a fresh payload
    mock_coordinator.data.vintages[0].bottles.pop()
    mock_coordinator.last_update_success = False
    listeners[0]()
    assert len(connection.messages) == 2
    assert connection.messages[1]["event"]["total_bottles"] == 3
    assert connection.messages[1]["event"]["last_update_success"] is False

    # Unsubscribing removes the coordinator listener
    connection.subscriptions[7]()
    unsub.assert_called_once()


def test_ws_subscribe_not_configured() -> None:
    """Subscribe without a configured cellar returns not_found."""
    hass = MockHass()
    connection = MockConnection()
    ws_subscribe(hass, connection, {"id": 8, "type": WS_TYPE_SUBSCRIBE})
    assert connection.errors[8][0] == "not_found"
    assert connection.subscriptions == {}
