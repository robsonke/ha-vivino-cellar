"""Button platform for Vivino Cellar integration."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from .const import CONF_CELLAR_URL, DOMAIN
from .coordinator import VivinoCellarCoordinator

_LOGGER = logging.getLogger(__name__)

try:
    from homeassistant.components.button import (
        ButtonDeviceClass,
        ButtonEntity,
        ButtonEntityDescription,
    )
    from homeassistant.config_entries import ConfigEntry
    from homeassistant.core import HomeAssistant
    from homeassistant.helpers.entity import DeviceInfo
    from homeassistant.helpers.entity_platform import AddEntitiesCallback
    from homeassistant.helpers.update_coordinator import CoordinatorEntity
except ImportError:
    # Graceful fallback stubs when running in test environment without Home Assistant core
    class ButtonEntity:  # type: ignore[no-redef]
        """Stub ButtonEntity."""

        entity_description: Any = None
        _attr_has_entity_name: bool = True
        _attr_name: str | None = None
        _attr_unique_id: str | None = None
        _attr_device_info: Any = None

        @property
        def has_entity_name(self) -> bool:
            return self._attr_has_entity_name

        @property
        def unique_id(self) -> str | None:
            return self._attr_unique_id

        @property
        def device_info(self) -> Any:
            return self._attr_device_info

        async def async_press(self) -> None:
            """Press the button."""
            self.press()

        def press(self) -> None:
            """Press the button synchronously."""

    class ButtonDeviceClass:  # type: ignore[no-redef]
        """Stub ButtonDeviceClass."""

        IDENTIFY = "identify"
        RESTART = "restart"
        UPDATE = "update"

    @dataclass(frozen=True, kw_only=True)
    class ButtonEntityDescription:  # type: ignore[no-redef]
        """Stub ButtonEntityDescription."""

        key: str
        translation_key: str | None = None
        name: str | None = None
        icon: str | None = None
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


BUTTON_TYPES: tuple[ButtonEntityDescription, ...] = (
    ButtonEntityDescription(
        key="refresh_cellar",
        translation_key="refresh_cellar",
        name="Refresh cellar",
        icon="mdi:refresh",
        device_class=ButtonDeviceClass.UPDATE,
    ),
)


class VivinoRefreshButton(CoordinatorEntity[VivinoCellarCoordinator], ButtonEntity):
    """Button entity to trigger manual cellar refresh with 30s debounce rate limit."""

    _attr_has_entity_name = True

    def __init__(
        self,
        coordinator: VivinoCellarCoordinator,
        entry: ConfigEntry,
        description: ButtonEntityDescription,
    ) -> None:
        """Initialize the Vivino Cellar refresh button."""
        super().__init__(coordinator)
        self.entry = entry
        self.entity_description = description
        self._attr_translation_key = description.translation_key or description.key
        self._attr_name = description.name
        self._attr_unique_id = f"{entry.unique_id or entry.entry_id}_{description.key}"
        self._last_press_time: datetime | None = None

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

    async def async_press(self) -> None:
        """Handle the button press with 30-second throttling."""
        now = datetime.now(UTC)

        last_refresh = getattr(self.coordinator, "last_refresh_time", None) or getattr(
            self.coordinator, "last_update_success_time", None
        )
        if isinstance(last_refresh, datetime):
            if last_refresh.tzinfo is None:
                last_refresh = last_refresh.replace(tzinfo=UTC)
            elapsed_refresh = (now - last_refresh).total_seconds()
            if 0 <= elapsed_refresh < 30:
                _LOGGER.info(
                    "Refresh ignored: cellar was refreshed %.1fs ago (minimum interval is 30s)",
                    elapsed_refresh,
                )
                return

        if isinstance(self._last_press_time, datetime):
            press_time = self._last_press_time
            if press_time.tzinfo is None:
                press_time = press_time.replace(tzinfo=UTC)
            elapsed_press = (now - press_time).total_seconds()
            if 0 <= elapsed_press < 30:
                _LOGGER.info(
                    "Refresh ignored: button was pressed %.1fs ago (minimum interval is 30s)",
                    elapsed_press,
                )
                return

        self._last_press_time = now
        await self.coordinator.async_refresh()


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up Vivino Cellar button entities from a config entry."""
    coordinator: VivinoCellarCoordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities(
        [
            VivinoRefreshButton(coordinator, entry, description)
            for description in BUTTON_TYPES
        ]
    )
