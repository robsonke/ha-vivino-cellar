"""Sidebar panel and frontend Lovelace card registration for Vivino Cellar."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

URL_BASE = "/vivino_cellar_frontend"
PANEL_URL = "vivino_cellar"
PANEL_TITLE = "Wijnkelder"
PANEL_ICON = "mdi:bottle-wine"
PANEL_WEBCOMPONENT = "vivino-cellar-card"
CARD_JS = "vivino-cellar-card.js"
VERSION = "0.1.0"

DATA_FRONTEND_REGISTERED = f"{DOMAIN}_frontend_registered"

try:
    from homeassistant.components.http import StaticPathConfig
except ImportError:
    class StaticPathConfig:  # type: ignore[no-redef]
        """Stub StaticPathConfig."""

        def __init__(self, url_path: str, path: str, cache_headers: bool = True) -> None:
            self.url_path = url_path
            self.path = path
            self.cache_headers = cache_headers


def _get_panel_custom(hass: Any) -> Any:
    """Get panel_custom component from hass or import."""
    try:
        from homeassistant.components import panel_custom

        return panel_custom
    except ImportError:
        pass

    if hasattr(hass, "components") and hasattr(hass.components, "panel_custom"):
        return hass.components.panel_custom
    if isinstance(getattr(hass, "data", None), dict) and "panel_custom" in hass.data:
        return hass.data["panel_custom"]
    return None


def _get_frontend_component(hass: Any) -> Any:
    """Get frontend component from hass or import."""
    try:
        from homeassistant.components import frontend

        return frontend
    except ImportError:
        pass

    if hasattr(hass, "components") and hasattr(hass.components, "frontend"):
        return hass.components.frontend
    if isinstance(getattr(hass, "data", None), dict) and "frontend" in hass.data:
        return hass.data["frontend"]
    return None


async def async_register_frontend(hass: Any) -> None:
    """Register frontend static path, Lovelace resource, and sidebar panel."""
    if (
        hasattr(hass, "data")
        and isinstance(hass.data, dict)
        and hass.data.get(DATA_FRONTEND_REGISTERED)
    ):
        return

    frontend_path = Path(__file__).parent / "frontend"
    card_url = f"{URL_BASE}/{CARD_JS}"

    # 1. Register static path
    if hasattr(hass, "http"):
        if hasattr(hass.http, "async_register_static_paths"):
            await hass.http.async_register_static_paths(
                [StaticPathConfig(URL_BASE, str(frontend_path), cache_headers=False)]
            )
        elif hasattr(hass.http, "register_static_path"):
            hass.http.register_static_path(URL_BASE, str(frontend_path), cache_headers=False)

    # 2. Register Lovelace dashboard resource
    await _async_register_lovelace_resource(hass, card_url)

    # 3. Register Extra JS URL (if frontend component supports it)
    frontend = _get_frontend_component(hass)
    if frontend and hasattr(frontend, "add_extra_js_url"):
        try:
            frontend.add_extra_js_url(hass, card_url)
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Could not add extra js url: %s", err)

    # 4. Register sidebar panel via panel_custom (standard HA API)
    panel_custom = _get_panel_custom(hass)
    registered = False

    if panel_custom and hasattr(panel_custom, "async_register_panel"):
        try:
            await panel_custom.async_register_panel(
                hass,
                frontend_url_path=PANEL_URL,
                webcomponent_name=PANEL_WEBCOMPONENT,
                sidebar_title=PANEL_TITLE,
                sidebar_icon=PANEL_ICON,
                module_url=f"{card_url}?v={VERSION}",
                require_admin=False,
                config={},
            )
            registered = True
            _LOGGER.info("Registered Vivino Cellar panel '%s' via panel_custom", PANEL_TITLE)
        except Exception as err:  # noqa: BLE001
            _LOGGER.warning("Failed to register Vivino Cellar panel via panel_custom: %s", err)

    if not registered and frontend and hasattr(frontend, "async_register_panel"):
        try:
            frontend.async_register_panel(
                hass,
                frontend_url_path=PANEL_URL,
                webcomponent_name=PANEL_WEBCOMPONENT,
                sidebar_title=PANEL_TITLE,
                sidebar_icon=PANEL_ICON,
                config={},
            )
            _LOGGER.info("Registered Vivino Cellar panel '%s' via frontend", PANEL_TITLE)
        except Exception as err:  # noqa: BLE001
            _LOGGER.warning("Failed to register Vivino Cellar panel via frontend: %s", err)

    if hasattr(hass, "data") and isinstance(hass.data, dict):
        hass.data[DATA_FRONTEND_REGISTERED] = True


async def _async_register_lovelace_resource(hass: Any, url: str) -> None:
    """Register card as a Lovelace resource if resources collection exists."""
    if not hasattr(hass, "data") or not isinstance(hass.data, dict):
        return

    lovelace = hass.data.get("lovelace")
    if not lovelace or not hasattr(lovelace, "resources"):
        return

    resources = lovelace.resources
    try:
        if hasattr(resources, "async_load") and not getattr(resources, "loaded", True):
            await resources.async_load()

        items: list[Any] = []
        if hasattr(resources, "async_items"):
            items = list(resources.async_items())
        elif hasattr(resources, "items"):
            items = list(resources.items)

        for item in items:
            item_url = item.get("url") if isinstance(item, dict) else getattr(item, "url", None)
            if item_url == url:
                _LOGGER.debug("Lovelace resource '%s' already registered", url)
                return

        if hasattr(resources, "async_create_item"):
            await resources.async_create_item({"res_type": "module", "url": url})
            _LOGGER.debug("Registered Lovelace resource '%s'", url)
    except Exception as err:  # noqa: BLE001
        _LOGGER.debug("Could not register Lovelace resource '%s': %s", url, err)


async def async_unregister_frontend(hass: Any) -> None:
    """Unregister sidebar panel on unload."""
    frontend = _get_frontend_component(hass)
    if frontend and hasattr(frontend, "async_remove_panel"):
        try:
            frontend.async_remove_panel(hass, PANEL_URL)
            _LOGGER.debug("Unregistered Vivino Cellar panel '%s'", PANEL_URL)
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Failed to remove Vivino Cellar panel: %s", err)

    if hasattr(hass, "data") and isinstance(hass.data, dict):
        hass.data.pop(DATA_FRONTEND_REGISTERED, None)
