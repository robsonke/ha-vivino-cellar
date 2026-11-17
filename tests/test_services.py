"""Tests for Vivino Cellar services (actions)."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.vivino_cellar.const import (
    DOMAIN,
    SERVICE_DRINK_BOTTLE,
    SERVICE_REFRESH,
    SERVICE_SUGGEST_PAIRING,
)
from custom_components.vivino_cellar.models import Bottle, FoodCategory, Vintage
from custom_components.vivino_cellar.pairing import PairingResult
from custom_components.vivino_cellar.services import (
    HomeAssistantError,
    ServiceCall,
    ServiceValidationError,
    SupportsResponse,
    async_setup_services,
    async_unload_services,
)


class MockServices:
    """Mock HomeAssistant service registry."""

    def __init__(self) -> None:
        self.services: dict[str, dict[str, dict]] = {}

    def has_service(self, domain: str, service: str) -> bool:
        return domain in self.services and service in self.services[domain]

    def async_register(
        self,
        domain: str,
        service: str,
        service_func: any,
        schema: any | None = None,
        supports_response: any = SupportsResponse.NONE,
    ) -> None:
        self.services.setdefault(domain, {})
        self.services[domain][service] = {
            "func": service_func,
            "schema": schema,
            "supports_response": supports_response,
        }

    def async_remove(self, domain: str, service: str) -> None:
        if domain in self.services:
            self.services[domain].pop(service, None)

    async def async_call(
        self,
        domain: str,
        service: str,
        service_data: dict,
        blocking: bool = True,
        return_response: bool = False,
    ) -> any:
        if not self.has_service(domain, service):
            raise HomeAssistantError(f"Service {domain}.{service} not registered")
        handler = self.services[domain][service]["func"]
        call = ServiceCall(domain, service, service_data)
        return await handler(call)


class MockHass:
    """Mock HomeAssistant."""

    def __init__(self) -> None:
        self.data: dict = {}
        self.services = MockServices()


def _create_sample_pairing_results() -> list[PairingResult]:
    """Create sample pairing results for tests."""
    bottle1 = Bottle(
        id=101,
        size_id=1,
        storage_location_id=10,
        location_name="Wine Fridge",
        bin="A1",
        created_at="2024-01-01",
        location_number=1,
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
        name="Château Margaux",
        winery="Château Margaux",
        region="Margaux",
        country="France",
        type_id=1,
        grapes=["Cabernet Sauvignon"],
        image_url="https://images.vivino.com/vintage1001.png",
        rating=4.7,
        ratings_count=1200,
        foods=[FoodCategory(id=1, name="Beef", seo_name="beef", weight=1.0)],
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
            explanation="Pairs with Beef",
        )
    ]


@pytest.fixture
def mock_coordinator() -> MagicMock:
    """Mock coordinator fixture."""
    coord = MagicMock()
    coord.async_suggest_pairing = AsyncMock(
        return_value=_create_sample_pairing_results()
    )
    coord.async_drink_bottle = AsyncMock()
    coord.async_refresh = AsyncMock()
    return coord


@pytest.mark.asyncio
async def test_services_registration_and_unregistration(
    mock_coordinator: MagicMock,
) -> None:
    """Test registering and unregistering vivino_cellar services."""
    hass = MockHass()
    hass.data[DOMAIN] = {"entry_1": mock_coordinator}

    await async_setup_services(hass)

    assert hass.services.has_service(DOMAIN, SERVICE_SUGGEST_PAIRING)
    assert hass.services.has_service(DOMAIN, SERVICE_DRINK_BOTTLE)
    assert hass.services.has_service(DOMAIN, SERVICE_REFRESH)

    suggest_meta = hass.services.services[DOMAIN][SERVICE_SUGGEST_PAIRING]
    assert suggest_meta["supports_response"] == SupportsResponse.ONLY

    # Idempotent registration
    await async_setup_services(hass)
    assert hass.services.has_service(DOMAIN, SERVICE_SUGGEST_PAIRING)

    # Unregister
    await async_unload_services(hass)
    assert not hass.services.has_service(DOMAIN, SERVICE_SUGGEST_PAIRING)
    assert not hass.services.has_service(DOMAIN, SERVICE_DRINK_BOTTLE)
    assert not hass.services.has_service(DOMAIN, SERVICE_REFRESH)


@pytest.mark.asyncio
async def test_suggest_pairing_with_dish(mock_coordinator: MagicMock) -> None:
    """Test vivino_cellar.suggest_pairing service with dish input."""
    hass = MockHass()
    hass.data[DOMAIN] = {"entry_1": mock_coordinator}
    await async_setup_services(hass)

    response = await hass.services.async_call(
        DOMAIN,
        SERVICE_SUGGEST_PAIRING,
        {"dish": "Grilled ribeye steak"},
        return_response=True,
    )

    mock_coordinator.async_suggest_pairing.assert_awaited_once_with(
        dish="Grilled ribeye steak",
        food_ids=None,
    )

    assert "matches" in response
    matches = response["matches"]
    assert len(matches) == 1
    match = matches[0]
    assert match["vintage_id"] == 1001
    assert match["name"] == "Château Margaux"
    assert match["winery"] == "Château Margaux"
    assert match["year"] == 2018
    assert match["rating"] == 4.7
    assert match["match_score"] == 0.95
    assert match["window_status"] == "ready"
    assert match["explanation"] == "Pairs with Beef"

    assert len(match["bottles"]) == 2
    b1 = match["bottles"][0]
    assert b1["bottle_id"] == 101
    assert b1["storage_location_id"] == 10
    assert b1["location_name"] == "Wine Fridge"
    assert b1["location_number"] == 1
    assert b1["bin"] == "A1"


@pytest.mark.asyncio
async def test_suggest_pairing_with_food_ids(mock_coordinator: MagicMock) -> None:
    """Test vivino_cellar.suggest_pairing service with food_ids input."""
    hass = MockHass()
    hass.data[DOMAIN] = {"entry_1": mock_coordinator}
    await async_setup_services(hass)

    response = await hass.services.async_call(
        DOMAIN,
        SERVICE_SUGGEST_PAIRING,
        {"food_ids": [1, 5]},
        return_response=True,
    )

    mock_coordinator.async_suggest_pairing.assert_awaited_once_with(
        dish=None,
        food_ids=[1, 5],
    )
    assert len(response["matches"]) == 1


@pytest.mark.asyncio
async def test_suggest_pairing_validation_errors(mock_coordinator: MagicMock) -> None:
    """Test exactly one of dish or food_ids must be provided."""
    hass = MockHass()
    hass.data[DOMAIN] = {"entry_1": mock_coordinator}
    await async_setup_services(hass)

    # Neither provided
    with pytest.raises(ServiceValidationError):
        await hass.services.async_call(DOMAIN, SERVICE_SUGGEST_PAIRING, {})

    # Both provided
    with pytest.raises(ServiceValidationError):
        await hass.services.async_call(
            DOMAIN,
            SERVICE_SUGGEST_PAIRING,
            {"dish": "Steak", "food_ids": [1]},
        )

    # Empty inputs provided
    with pytest.raises(ServiceValidationError):
        await hass.services.async_call(
            DOMAIN,
            SERVICE_SUGGEST_PAIRING,
            {"dish": "   ", "food_ids": []},
        )


@pytest.mark.asyncio
async def test_drink_bottle_service(mock_coordinator: MagicMock) -> None:
    """Test vivino_cellar.drink_bottle service call."""
    hass = MockHass()
    hass.data[DOMAIN] = {"entry_1": mock_coordinator}
    await async_setup_services(hass)

    await hass.services.async_call(
        DOMAIN,
        SERVICE_DRINK_BOTTLE,
        {"bottle_id": 101, "vintage_id": 1001},
    )

    mock_coordinator.async_drink_bottle.assert_awaited_once_with(
        bottle_id=101,
        vintage_id=1001,
    )


@pytest.mark.asyncio
async def test_drink_bottle_without_vintage_id(mock_coordinator: MagicMock) -> None:
    """Test vivino_cellar.drink_bottle service call without vintage_id."""
    hass = MockHass()
    hass.data[DOMAIN] = {"entry_1": mock_coordinator}
    await async_setup_services(hass)

    await hass.services.async_call(
        DOMAIN,
        SERVICE_DRINK_BOTTLE,
        {"bottle_id": 102},
    )

    mock_coordinator.async_drink_bottle.assert_awaited_once_with(
        bottle_id=102,
        vintage_id=None,
    )


@pytest.mark.asyncio
async def test_drink_bottle_validation(mock_coordinator: MagicMock) -> None:
    """Test vivino_cellar.drink_bottle raises error when bottle_id is missing."""
    hass = MockHass()
    hass.data[DOMAIN] = {"entry_1": mock_coordinator}
    await async_setup_services(hass)

    with pytest.raises(ServiceValidationError):
        await hass.services.async_call(DOMAIN, SERVICE_DRINK_BOTTLE, {})


@pytest.mark.asyncio
async def test_refresh_service(mock_coordinator: MagicMock) -> None:
    """Test vivino_cellar.refresh service call."""
    hass = MockHass()
    hass.data[DOMAIN] = {"entry_1": mock_coordinator}
    await async_setup_services(hass)

    await hass.services.async_call(DOMAIN, SERVICE_REFRESH, {})
    mock_coordinator.async_refresh.assert_awaited_once()


@pytest.mark.asyncio
async def test_service_with_specific_entry_id(mock_coordinator: MagicMock) -> None:
    """Test targeted coordinator when entry_id is specified."""
    coord_other = MagicMock()
    coord_other.async_refresh = AsyncMock()

    hass = MockHass()
    hass.data[DOMAIN] = {
        "entry_1": mock_coordinator,
        "entry_2": coord_other,
    }
    await async_setup_services(hass)

    await hass.services.async_call(
        DOMAIN,
        SERVICE_REFRESH,
        {"entry_id": "entry_2"},
    )
    coord_other.async_refresh.assert_awaited_once()
    mock_coordinator.async_refresh.assert_not_called()


@pytest.mark.asyncio
async def test_service_coordinator_not_found_raises() -> None:
    """Test error when no coordinators exist."""
    hass = MockHass()
    hass.data[DOMAIN] = {}
    await async_setup_services(hass)

    with pytest.raises(HomeAssistantError):
        await hass.services.async_call(
            DOMAIN,
            SERVICE_REFRESH,
            {},
        )


@pytest.mark.asyncio
async def test_init_entry_lifecycle_registers_and_unloads_services() -> None:
    """Test __init__.py async_setup_entry registers services & intents and unload cleans them up."""
    from unittest.mock import patch

    from custom_components.vivino_cellar import async_setup_entry, async_unload_entry
    from custom_components.vivino_cellar.const import (
        CONF_CELLAR_URL,
        CONF_COOKIE,
        INTENT_SUGGEST_WINE,
    )

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

        # Verify services and intent were registered
        assert hass.services.has_service(DOMAIN, SERVICE_SUGGEST_PAIRING)
        assert hass.services.has_service(DOMAIN, SERVICE_DRINK_BOTTLE)
        assert hass.services.has_service(DOMAIN, SERVICE_REFRESH)
        assert "intent" in hass.data
        assert INTENT_SUGGEST_WINE in hass.data["intent"]

        # Unload entry
        unload_ok = await async_unload_entry(hass, entry)
        assert unload_ok is True

        # Verify services and intent were unregistered
        assert not hass.services.has_service(DOMAIN, SERVICE_SUGGEST_PAIRING)
        assert not hass.services.has_service(DOMAIN, SERVICE_DRINK_BOTTLE)
        assert not hass.services.has_service(DOMAIN, SERVICE_REFRESH)
        assert INTENT_SUGGEST_WINE not in hass.data.get("intent", {})
