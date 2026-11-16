"""The Vivino Cellar integration."""

from __future__ import annotations

from datetime import timedelta
import logging
from typing import Any

from .const import (
    CONF_AI_TASK,
    CONF_CELLAR_URL,
    CONF_COOKIE,
    CONF_SCAN_INTERVAL,
    CONF_SHOW_PANEL,
    DOMAIN,
    cellar_settings,
)
from .coordinator import VivinoCellarCoordinator
from .intent import async_setup_intents, async_unload_intents
from .panel import async_register_frontend, async_unregister_frontend
from .services import async_setup_services, async_unload_services
from .vivino_client import VivinoClient
from .websocket_api import async_setup_websocket_api, async_unload_websocket_api

_LOGGER = logging.getLogger(__name__)

try:
    from homeassistant.config_entries import ConfigEntry
    from homeassistant.const import Platform
    from homeassistant.core import HomeAssistant
    from homeassistant.helpers.aiohttp_client import async_get_clientsession
except ImportError:
    # Graceful fallback stubs when running in test environment without Home Assistant core
    class Platform:  # type: ignore[no-redef]
        """Stub Platform enum."""

        SENSOR = "sensor"
        BUTTON = "button"

    class ConfigEntry:  # type: ignore[no-redef]
        """Stub ConfigEntry."""

        entry_id: str
        unique_id: str | None = None
        data: dict[str, Any]
        options: dict[str, Any]

        def async_on_unload(self, callback: Any) -> None:
            """Stub async_on_unload."""

    class HomeAssistant:  # type: ignore[no-redef]
        """Stub HomeAssistant."""

        data: dict[str, Any]
        config_entries: Any

    def async_get_clientsession(hass: Any) -> Any:  # type: ignore[no-redef]
        """Stub get client session."""
        if hasattr(hass, "client_session"):
            return hass.client_session
        if hasattr(hass, "helpers") and hasattr(hass.helpers, "aiohttp_client"):
            return hass.helpers.aiohttp_client.async_get_clientsession(hass)
        import aiohttp

        return aiohttp.ClientSession()


PLATFORMS: list[Platform] = [
    Platform.SENSOR,
    Platform.BUTTON,
]


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Vivino Cellar from a config entry."""
    session = async_get_clientsession(hass)
    cellar_url = entry.data[CONF_CELLAR_URL]
    cookie = entry.data[CONF_COOKIE]
    settings = cellar_settings(entry)

    client = VivinoClient(
        session=session,
        cellar_url=cellar_url,
        cookie=cookie,
    )

    coordinator = VivinoCellarCoordinator(
        hass=hass,
        client=client,
        ai_task_entity=settings[CONF_AI_TASK],
        update_interval=timedelta(hours=settings[CONF_SCAN_INTERVAL]),
    )
    # Applied settings; the card reads title and list size from the payload.
    coordinator.settings = settings

    await coordinator.async_config_entry_first_refresh()

    def _check_rotated_cookie() -> None:
        rotated = client.get_rotated_cookie()
        if rotated and rotated != entry.data.get(CONF_COOKIE):
            _LOGGER.debug("Vivino session cookie rotated, updating config entry")
            hass.config_entries.async_update_entry(
                entry,
                data={**entry.data, CONF_COOKIE: rotated},
            )

    _check_rotated_cookie()
    if hasattr(entry, "async_on_unload"):
        entry.async_on_unload(coordinator.async_add_listener(_check_rotated_cookie))

    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = coordinator

    await async_setup_services(hass)
    await async_setup_intents(hass)
    await async_setup_websocket_api(hass)
    await async_register_frontend(
        hass, title=settings["title"], show_panel=settings[CONF_SHOW_PANEL]
    )

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    if hasattr(entry, "add_update_listener"):
        entry.async_on_unload(entry.add_update_listener(_async_update_listener))

    return True


async def _async_update_listener(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Reload when the name or options change.

    Update listeners also fire when the rotated session cookie is saved to
    entry.data; that must not reload, so compare the resolved settings.
    """
    coordinator = hass.data.get(DOMAIN, {}).get(entry.entry_id)
    if coordinator is not None and getattr(coordinator, "settings", None) == (
        cellar_settings(entry)
    ):
        return
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a Vivino Cellar config entry."""
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unload_ok:
        hass.data[DOMAIN].pop(entry.entry_id, None)
        if not hass.data[DOMAIN]:
            await async_unload_services(hass)
            await async_unload_intents(hass)
            await async_unload_websocket_api(hass)
            await async_unregister_frontend(hass)

    return unload_ok
