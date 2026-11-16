"""Sensor platform for Vivino Cellar integration."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
import logging
from typing import Any

from .const import CONF_CELLAR_URL, DOMAIN
from .coordinator import VivinoCellarCoordinator
from .window_engine import (
    WINDOW_STATUS_CAN_WAIT,
    WINDOW_STATUS_HOLD,
    WINDOW_STATUS_NEAR_PAST_PEAK,
    WINDOW_STATUS_PAST_PEAK,
    WINDOW_STATUS_READY,
    WINDOW_STATUS_UNKNOWN,
    compute_vintage_window_status,
)

_LOGGER = logging.getLogger(__name__)

try:
    from homeassistant.components.sensor import (
        SensorDeviceClass,
        SensorEntity,
        SensorEntityDescription,
        SensorStateClass,
    )
    from homeassistant.config_entries import ConfigEntry
    from homeassistant.core import HomeAssistant
    from homeassistant.helpers.entity import DeviceInfo
    from homeassistant.helpers.entity_platform import AddEntitiesCallback
    from homeassistant.helpers.update_coordinator import CoordinatorEntity
except ImportError:
    # Graceful fallback stubs when running in test environment without Home Assistant core
    class SensorEntity:  # type: ignore[no-redef]
        """Stub SensorEntity."""

        entity_description: Any = None
        _attr_has_entity_name: bool = True
        _attr_name: str | None = None
        _attr_unique_id: str | None = None
        _attr_device_info: Any = None
        _attr_extra_state_attributes: dict[str, Any] | None = None

        @property
        def has_entity_name(self) -> bool:
            return self._attr_has_entity_name

        @property
        def unique_id(self) -> str | None:
            return self._attr_unique_id

        @property
        def device_info(self) -> Any:
            return self._attr_device_info

        @property
        def native_value(self) -> Any:
            return None

        @property
        def state(self) -> Any:
            return self.native_value

        @property
        def extra_state_attributes(self) -> dict[str, Any] | None:
            return self._attr_extra_state_attributes

    class SensorDeviceClass:  # type: ignore[no-redef]
        """Stub SensorDeviceClass."""

    class SensorStateClass:  # type: ignore[no-redef]
        """Stub SensorStateClass."""

        TOTAL = "total"
        MEASUREMENT = "measurement"

    @dataclass(frozen=True, kw_only=True)
    class SensorEntityDescription:  # type: ignore[no-redef]
        """Stub SensorEntityDescription."""

        key: str
        translation_key: str | None = None
        name: str | None = None
        icon: str | None = None
        native_unit_of_measurement: str | None = None
        state_class: Any | None = None
        device_class: Any | None = None

    @dataclass(frozen=True)
    class DeviceInfo:  # type: ignore[no-redef]
        """Stub DeviceInfo."""

        identifiers: set[tuple[str, str]] | None = None
        name: str | None = None
        manufacturer: str | None = None
        model: str | None = None
        configuration_url: str | None = None
        entry_type: Any | None = None

    class CoordinatorEntity[CoordinatorT]:  # type: ignore[no-redef]
        """Stub CoordinatorEntity."""

        def __init__(self, coordinator: CoordinatorT) -> None:
            self.coordinator = coordinator

    class ConfigEntry:  # type: ignore[no-redef]
        """Stub ConfigEntry."""

        entry_id: str
        unique_id: str | None = None
        data: dict[str, Any]

    class HomeAssistant:  # type: ignore[no-redef]
        """Stub HomeAssistant."""

        data: dict[str, Any]

    AddEntitiesCallback = Any  # type: ignore[misc]


SENSOR_TYPES: tuple[SensorEntityDescription, ...] = (
    SensorEntityDescription(
        key="total_bottles",
        translation_key="total_bottles",
        icon="mdi:bottle-wine",
        native_unit_of_measurement="bottles",
        state_class=SensorStateClass.MEASUREMENT,
    ),
    SensorEntityDescription(
        key=WINDOW_STATUS_READY,
        translation_key="ready",
        icon="mdi:glass-wine",
        native_unit_of_measurement="bottles",
        state_class=SensorStateClass.MEASUREMENT,
    ),
    SensorEntityDescription(
        key=WINDOW_STATUS_CAN_WAIT,
        translation_key="can_wait",
        icon="mdi:timer-sand",
        native_unit_of_measurement="bottles",
        state_class=SensorStateClass.MEASUREMENT,
    ),
    SensorEntityDescription(
        key=WINDOW_STATUS_NEAR_PAST_PEAK,
        translation_key="near_past_peak",
        icon="mdi:clock-alert-outline",
        native_unit_of_measurement="bottles",
        state_class=SensorStateClass.MEASUREMENT,
    ),
    SensorEntityDescription(
        key=WINDOW_STATUS_HOLD,
        translation_key="hold",
        icon="mdi:clock-outline",
        native_unit_of_measurement="bottles",
        state_class=SensorStateClass.MEASUREMENT,
    ),
    SensorEntityDescription(
        key=WINDOW_STATUS_PAST_PEAK,
        translation_key="past_peak",
        icon="mdi:alert-circle-outline",
        native_unit_of_measurement="bottles",
        state_class=SensorStateClass.MEASUREMENT,
    ),
    SensorEntityDescription(
        key=WINDOW_STATUS_UNKNOWN,
        translation_key="unknown",
        icon="mdi:help-circle-outline",
        native_unit_of_measurement="bottles",
        state_class=SensorStateClass.MEASUREMENT,
    ),
)


class VivinoCellarSensor(CoordinatorEntity[VivinoCellarCoordinator], SensorEntity):
    """Sensor representing cellar bottle counts."""

    _attr_has_entity_name = True

    def __init__(
        self,
        coordinator: VivinoCellarCoordinator,
        entry: ConfigEntry,
        description: SensorEntityDescription,
    ) -> None:
        """Initialize the Vivino Cellar sensor."""
        super().__init__(coordinator)
        self.entry = entry
        self.entity_description = description
        self._attr_translation_key = description.translation_key or description.key
        if not description.translation_key:
            self._attr_name = description.name
        self._attr_unique_id = f"{entry.unique_id or entry.entry_id}_{description.key}"

        cellar_id = (
            getattr(getattr(coordinator, "client", None), "cellar_id", None)
            or getattr(entry, "unique_id", None)
            or entry.entry_id
        )
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, str(cellar_id))},
            name=f"Vivino Cellar {cellar_id}",
            manufacturer="Vivino",
            model="Cellar",
            configuration_url=entry.data.get(CONF_CELLAR_URL),
        )

    @property
    def native_value(self) -> int:
        """Return the count of bottles for this sensor."""
        if not self.coordinator.data or not self.coordinator.data.vintages:
            return 0

        vintages = self.coordinator.data.vintages
        key = self.entity_description.key

        if key == "total_bottles":
            return sum(len(v.bottles) for v in vintages)

        current_year = datetime.now(UTC).year
        return sum(
            len(v.bottles)
            for v in vintages
            if compute_vintage_window_status(v, current_year) == key
        )

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return light attributes (lists of wine names)."""
        if not self.coordinator.data or not self.coordinator.data.vintages:
            return {}

        vintages = self.coordinator.data.vintages
        key = self.entity_description.key

        if key == "total_bottles":
            return {
                "total_vintages": len(vintages),
            }

        current_year = datetime.now(UTC).year
        matching_wines = [
            v.name
            for v in vintages
            if compute_vintage_window_status(v, current_year) == key
        ]
        return {
            "wines": matching_wines,
        }


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up Vivino Cellar sensor entities from a config entry."""
    coordinator: VivinoCellarCoordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities(
        [
            VivinoCellarSensor(coordinator, entry, description)
            for description in SENSOR_TYPES
        ]
    )
