"""Sidebar panel and frontend Lovelace card registration for Vivino Cellar."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from .const import DEFAULT_TITLE

_LOGGER = logging.getLogger(__name__)

URL_BASE = "/vivino_cellar_frontend"
PANEL_URL = "vivino_cellar"
PANEL_ICON = "mdi:bottle-wine"
PANEL_WEBCOMPONENT = "vivino-cellar-card"
CARD_JS = "vivino-cellar-card.js"
VERSION = "0.3.0"

try:
    from homeassistant.components.http import StaticPathConfig
except ImportError:

    class StaticPathConfig:  # type: ignore[no-redef]
        """Stub StaticPathConfig."""

        def __init__(
            self, url_path: str, path: str, cache_headers: bool = True
        ) -> None:
            self.url_path = url_path
            self.path = path
            self.cache_headers = cache_headers


async def _ensure_panel_custom(hass: Any) -> Any:
    """Ensure panel_custom component is set up and return module."""
    try:
        from homeassistant.components import panel_custom
        from homeassistant.setup import async_setup_component

        if hasattr(hass, "config") and hasattr(hass.config, "components"):
            if "panel_custom" not in hass.config.components:
                await async_setup_component(hass, "panel_custom", {})
        return panel_custom
    except Exception as err:  # noqa: BLE001
        _LOGGER.debug("Could not ensure panel_custom: %s", err)

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


async def async_register_frontend(
    hass: Any, *, title: str = DEFAULT_TITLE, show_panel: bool = True
) -> None:
    """Register frontend static path, Lovelace resource, and sidebar panel.

    The card is always served (dashboards use it); the sidebar panel only
    when show_panel is on.
    """
    # Check if panel is already registered
    panels = (
        hass.data.get("frontend_panels", {})
        if hasattr(hass, "data") and isinstance(hass.data, dict)
        else {}
    )
    if PANEL_URL in panels:
        return

    frontend = _get_frontend_component(hass)
    if (
        frontend
        and hasattr(frontend, "panels")
        and isinstance(frontend.panels, dict)
        and PANEL_URL in frontend.panels
    ):
        return

    frontend_path = Path(__file__).parent / "frontend"
    # Version every URL: browsers cache the unversioned file, and the first
    # copy to load wins the custom element name.
    card_url = f"{URL_BASE}/{CARD_JS}?v={VERSION}"

    # 1. Register static path (ignore duplicate registration errors)
    if hasattr(hass, "http"):
        try:
            if hasattr(hass.http, "async_register_static_paths"):
                await hass.http.async_register_static_paths(
                    [
                        StaticPathConfig(
                            URL_BASE, str(frontend_path), cache_headers=False
                        )
                    ]
                )
            elif hasattr(hass.http, "register_static_path"):
                hass.http.register_static_path(
                    URL_BASE, str(frontend_path), cache_headers=False
                )
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Static path registration notice: %s", err)

    # 2. Register Lovelace dashboard resource
    await _async_register_lovelace_resource(hass, card_url)

    # 3. Register Extra JS URL
    if frontend and hasattr(frontend, "add_extra_js_url"):
        try:
            frontend.add_extra_js_url(hass, card_url)
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Could not add extra js url: %s", err)

    # 4. Remove previous panel registration if already present to allow clean update
    if frontend and hasattr(frontend, "async_remove_panel"):
        try:
            frontend.async_remove_panel(hass, PANEL_URL)
        except Exception:  # noqa: BLE001
            pass

    if not show_panel:
        _LOGGER.debug("Sidebar panel turned off in the integration options")
        return

    # 5. Register sidebar panel via panel_custom
    panel_custom = await _ensure_panel_custom(hass)
    registered = False

    if panel_custom and hasattr(panel_custom, "async_register_panel"):
        try:
            import inspect

            res = panel_custom.async_register_panel(
                hass,
                frontend_url_path=PANEL_URL,
                webcomponent_name=PANEL_WEBCOMPONENT,
                sidebar_title=title,
                sidebar_icon=PANEL_ICON,
                module_url=card_url,
                require_admin=False,
                config={},
            )
            if inspect.isawaitable(res):
                await res
            registered = True
            _LOGGER.info("Registered Vivino Cellar panel '%s' via panel_custom", title)
        except Exception as err:  # noqa: BLE001
            _LOGGER.warning(
                "Failed to register Vivino Cellar panel via panel_custom: %s", err
            )

    if not registered and frontend and hasattr(frontend, "async_register_panel"):
        try:
            frontend.async_register_panel(
                hass,
                frontend_url_path=PANEL_URL,
                webcomponent_name=PANEL_WEBCOMPONENT,
                sidebar_title=title,
                sidebar_icon=PANEL_ICON,
                config={},
            )
            _LOGGER.info(
                "Registered Vivino Cellar panel '%s' via frontend fallback", title
            )
        except Exception as err:  # noqa: BLE001
            _LOGGER.warning(
                "Failed to register Vivino Cellar panel via frontend fallback: %s", err
            )


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

        base = url.split("?", 1)[0]
        for item in items:
            item_url = (
                item.get("url")
                if isinstance(item, dict)
                else getattr(item, "url", None)
            )
            if not item_url or item_url.split("?", 1)[0] != base:
                continue
            if item_url == url:
                _LOGGER.debug("Lovelace resource '%s' already registered", url)
                return
            item_id = (
                item.get("id") if isinstance(item, dict) else getattr(item, "id", None)
            )
            if item_id and hasattr(resources, "async_update_item"):
                await resources.async_update_item(
                    item_id, {"res_type": "module", "url": url}
                )
                _LOGGER.debug("Updated Lovelace resource '%s' -> '%s'", item_url, url)
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
