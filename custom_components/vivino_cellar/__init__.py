"""The Vivino Cellar integration."""

from __future__ import annotations

import logging
from typing import Any

from .const import CONF_AI_TASK, CONF_CELLAR_URL, CONF_COOKIE, DOMAIN
from .coordinator import VivinoCellarCoordinator
from .intent import async_setup_intents, async_unload_intents
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
    ai_task = getattr(entry, "options", {}).get(CONF_AI_TASK) or entry.data.get(
        CONF_AI_TASK
    )

    client = VivinoClient(
        session=session,
        cellar_url=cellar_url,
        cookie=cookie,
    )

    coordinator = VivinoCellarCoordinator(
        hass=hass,
        client=client,
        ai_task_entity=ai_task,
    )

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

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a Vivino Cellar config entry."""
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unload_ok:
        hass.data[DOMAIN].pop(entry.entry_id, None)
        if not hass.data[DOMAIN]:
            await async_unload_services(hass)
            await async_unload_intents(hass)
            await async_unload_websocket_api(hass)

    return unload_ok
