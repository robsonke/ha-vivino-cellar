"""Tests for Vivino Cellar sensor platform and integration setup."""

from __future__ import annotations

from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from custom_components.vivino_cellar import (
    PLATFORMS,
    async_setup_entry,
    async_unload_entry,
)
from custom_components.vivino_cellar.const import (
    CONF_CELLAR_URL,
    CONF_COOKIE,
    DOMAIN,
)
from custom_components.vivino_cellar.models import (
    Bottle,
    CellarData,
    FoodCategory,
    Vintage,
    WineStyle,
)
from custom_components.vivino_cellar.sensor import (
    SENSOR_TYPES,
    VivinoCellarSensor,
    async_setup_entry as async_setup_sensor_entry,
)


def _create_test_bottle(bottle_id: int) -> Bottle:
    return Bottle(
        id=bottle_id,
        size_id=1,
        storage_location_id=1,
        location_name="Rack A",
        bin="1",
        created_at="2024-01-01",
    )


def _create_sample_cellar_data() -> CellarData:
    """Create sample cellar data with vintages spanning all 5 statuses."""
    current_year = datetime.now().year

    # 1. Ready: start_year <= current_year < end_year
    v_ready = Vintage(
        id=1,
        year=current_year - 4,
        name="Ready Wine",
        winery="Winery A",
        region="Bordeaux",
        country="France",
        type_id=1,
        grapes=["Cabernet Sauvignon"],
        image_url=None,
        rating=4.5,
        ratings_count=100,
        foods=[],
        style=None,
        bottles=[_create_test_bottle(101), _create_test_bottle(102)],
        start_year=current_year - 2,
        end_year=current_year + 5,
        window_source="vivino",
    )

    # 2. Near past peak: end_year == current_year
    v_near = Vintage(
        id=2,
        year=current_year - 5,
        name="Near Past Peak Wine",
        winery="Winery B",
        region="Rioja",
        country="Spain",
        type_id=1,
        grapes=["Tempranillo"],
        image_url=None,
        rating=4.2,
        ratings_count=50,
        foods=[],
        style=None,
        bottles=[_create_test_bottle(201)],
        start_year=current_year - 3,
        end_year=current_year,
        window_source="vivino",
    )

    # 3. Hold: start_year > current_year
    v_hold = Vintage(
        id=3,
        year=current_year - 1,
        name="Hold Wine",
        winery="Winery C",
        region="Piedmont",
        country="Italy",
        type_id=1,
        grapes=["Nebbiolo"],
        image_url=None,
        rating=4.8,
        ratings_count=200,
        foods=[],
        style=None,
        bottles=[
            _create_test_bottle(301),
            _create_test_bottle(302),
            _create_test_bottle(303),
        ],
        start_year=current_year + 2,
        end_year=current_year + 10,
        window_source="vivino",
    )

    # 4. Past peak: end_year < current_year
    v_past = Vintage(
        id=4,
        year=current_year - 10,
        name="Past Peak Wine",
        winery="Winery D",
        region="Burgundy",
        country="France",
        type_id=1,
        grapes=["Pinot Noir"],
        image_url=None,
        rating=3.9,
        ratings_count=80,
        foods=[],
        style=None,
        bottles=[_create_test_bottle(401)],
        start_year=current_year - 8,
        end_year=current_year - 1,
        window_source="vivino",
    )

    # 5. Unknown: start_year or end_year is None
    v_unknown = Vintage(
        id=5,
        year=current_year - 2,
        name="Unknown Window Wine",
        winery="Winery E",
        region="Napa Valley",
        country="USA",
        type_id=1,
        grapes=["Chardonnay"],
        image_url=None,
        rating=4.0,
        ratings_count=60,
        foods=[],
        style=None,
        bottles=[
            _create_test_bottle(501),
            _create_test_bottle(502),
            _create_test_bottle(503),
            _create_test_bottle(504),
        ],
        start_year=None,
        end_year=None,
        window_source="none",
    )

    return CellarData(
        cellar_id="651553",
        locale="nl",
        total_count=11,
        vintages=[v_ready, v_near, v_hold, v_past, v_unknown],
        food_categories=[],
    )


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
        self.options = {}
        self.title = "Vivino Cellar 651553"
        self._unload_callbacks: list = []

    def async_on_unload(self, callback) -> None:
        self._unload_callbacks.append(callback)


class MockHass:
    """Mock HomeAssistant object."""

    def __init__(self) -> None:
        self.data: dict = {}
        self.config_entries = MagicMock()
        self.config_entries.async_update_entry = MagicMock()
        self.config_entries.async_forward_entry_setups = AsyncMock(return_value=True)
        self.config_entries.async_unload_platforms = AsyncMock(return_value=True)
        self.client_session = MagicMock()


@pytest.fixture
def mock_coordinator() -> MagicMock:
    """Fixture providing a mock coordinator with sample cellar data."""
    coord = MagicMock()
    coord.data = _create_sample_cellar_data()
    coord.last_refresh_time = datetime.now()
    coord.client = MagicMock()
    coord.client.cellar_id = "651553"
    coord.client.get_rotated_cookie = MagicMock(return_value=None)
    coord.async_add_listener = MagicMock(return_value=lambda: None)
    return coord


@pytest.mark.asyncio
async def test_sensor_setup_entry(mock_coordinator: MagicMock) -> None:
    """Test setting up the sensor platform creates all 6 sensor entities."""
    hass = MockHass()
    entry = MockConfigEntry()
    hass.data[DOMAIN] = {entry.entry_id: mock_coordinator}

    added_entities: list[VivinoCellarSensor] = []

    def async_add_entities(entities: list[VivinoCellarSensor]) -> None:
        added_entities.extend(entities)

    await async_setup_sensor_entry(hass, entry, async_add_entities)

    assert len(added_entities) == 6
    keys = {entity.entity_description.key for entity in added_entities}
    assert keys == {
        "total_bottles",
        "ready",
        "near_past_peak",
        "hold",
        "past_peak",
        "unknown",
    }


def test_sensor_bottle_counts_and_attributes(mock_coordinator: MagicMock) -> None:
    """Test that all sensors accurately report bottle counts and attributes."""
    entry = MockConfigEntry()
    sensors = {
        desc.key: VivinoCellarSensor(mock_coordinator, entry, desc)
        for desc in SENSOR_TYPES
    }

    # Verify counts:
    # v_ready has 2 bottles
    # v_near has 1 bottle
    # v_hold has 3 bottles
    # v_past has 1 bottle
    # v_unknown has 4 bottles
    # Total = 11 bottles
    assert sensors["total_bottles"].native_value == 11
    assert sensors["ready"].native_value == 2
    assert sensors["near_past_peak"].native_value == 1
    assert sensors["hold"].native_value == 3
    assert sensors["past_peak"].native_value == 1
    assert sensors["unknown"].native_value == 4

    # Verify attributes contain wine lists:
    ready_attrs = sensors["ready"].extra_state_attributes
    assert ready_attrs is not None
    assert ready_attrs["wines"] == ["Ready Wine"]

    near_attrs = sensors["near_past_peak"].extra_state_attributes
    assert near_attrs is not None
    assert near_attrs["wines"] == ["Near Past Peak Wine"]

    hold_attrs = sensors["hold"].extra_state_attributes
    assert hold_attrs is not None
    assert hold_attrs["wines"] == ["Hold Wine"]

    past_attrs = sensors["past_peak"].extra_state_attributes
    assert past_attrs is not None
    assert past_attrs["wines"] == ["Past Peak Wine"]

    unknown_attrs = sensors["unknown"].extra_state_attributes
    assert unknown_attrs is not None
    assert unknown_attrs["wines"] == ["Unknown Window Wine"]

    total_attrs = sensors["total_bottles"].extra_state_attributes
    assert total_attrs is not None
    assert total_attrs["total_vintages"] == 5


def test_sensor_empty_or_none_data(mock_coordinator: MagicMock) -> None:
    """Test sensors handle None or empty cellar data gracefully."""
    entry = MockConfigEntry()
    mock_coordinator.data = None

    sensors = [
        VivinoCellarSensor(mock_coordinator, entry, desc) for desc in SENSOR_TYPES
    ]
    for s in sensors:
        assert s.native_value == 0
        assert s.extra_state_attributes == {}


def test_sensor_metadata(mock_coordinator: MagicMock) -> None:
    """Test sensor unique_id and device_info."""
    entry = MockConfigEntry()
    sensor = VivinoCellarSensor(mock_coordinator, entry, SENSOR_TYPES[0])

    assert sensor.unique_id == f"{entry.unique_id}_{SENSOR_TYPES[0].key}"
    assert sensor.has_entity_name is True
    device_info = sensor.device_info
    assert (DOMAIN, "651553") in device_info.identifiers
    assert device_info.manufacturer == "Vivino"


@pytest.mark.asyncio
async def test_integration_async_setup_and_unload_entry() -> None:
    """Test full async_setup_entry and async_unload_entry lifecycle in __init__.py."""
    hass = MockHass()
    entry = MockConfigEntry()

    mock_client = MagicMock()
    mock_client.cellar_id = "651553"
    mock_client.get_rotated_cookie.return_value = None
    mock_client.async_fetch_cellar = AsyncMock(return_value=_create_sample_cellar_data())

    with (
        patch(
            "custom_components.vivino_cellar.VivinoClient",
            return_value=mock_client,
        ),
        patch(
            "custom_components.vivino_cellar.coordinator.Store.async_load",
            new_callable=AsyncMock,
            return_value=None,
        ),
    ):
        setup_success = await async_setup_entry(hass, entry)
        assert setup_success is True
        assert DOMAIN in hass.data
        assert entry.entry_id in hass.data[DOMAIN]

        coordinator = hass.data[DOMAIN][entry.entry_id]
        assert coordinator.data is not None
        assert len(coordinator.data.vintages) == 5

        # Check platform forwarding
        hass.config_entries.async_forward_entry_setups.assert_awaited_once_with(
            entry, PLATFORMS
        )

        # Test unload
        unload_success = await async_unload_entry(hass, entry)
        assert unload_success is True
        assert entry.entry_id not in hass.data[DOMAIN]
        hass.config_entries.async_unload_platforms.assert_awaited_once_with(
            entry, PLATFORMS
        )


@pytest.mark.asyncio
async def test_integration_cookie_rotation_update() -> None:
    """Test that cookie rotation updates config entry data."""
    hass = MockHass()
    entry = MockConfigEntry()

    mock_client = MagicMock()
    mock_client.cellar_id = "651553"
    # Initially returns rotated cookie
    mock_client.get_rotated_cookie.return_value = "_ruby-web_session=rotated_cookie_456"
    mock_client.async_fetch_cellar = AsyncMock(return_value=_create_sample_cellar_data())

    with (
        patch(
            "custom_components.vivino_cellar.VivinoClient",
            return_value=mock_client,
        ),
        patch(
            "custom_components.vivino_cellar.coordinator.Store.async_load",
            new_callable=AsyncMock,
            return_value=None,
        ),
    ):
        await async_setup_entry(hass, entry)

        # async_update_entry should have been called with the rotated cookie
        hass.config_entries.async_update_entry.assert_called_with(
            entry,
            data={**entry.data, CONF_COOKIE: "_ruby-web_session=rotated_cookie_456"},
        )
