"""Tests for frontend panel and card resource registration."""

from __future__ import annotations

from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from custom_components.vivino_cellar import async_setup_entry, async_unload_entry
from custom_components.vivino_cellar.const import (
    CONF_CELLAR_URL,
    CONF_COOKIE,
)
from custom_components.vivino_cellar.panel import (
    URL_BASE,
    async_register_frontend,
    async_unregister_frontend,
)


class MockHttp:
    """Mock HomeAssistant http component."""

    def __init__(self) -> None:
        self.static_paths: list[Any] = []
        self.async_register_static_paths = AsyncMock(
            side_effect=lambda paths: self.static_paths.extend(paths)
        )
        self.register_static_path = MagicMock(
            side_effect=lambda url, path, cache_headers=True: self.static_paths.append(
                (url, path, cache_headers)
            )
        )


class MockFrontend:
    """Mock HomeAssistant frontend component."""

    def __init__(self) -> None:
        self.panels: dict[str, dict] = {}
        self.extra_js_urls: list[str] = []
        self.async_register_panel = MagicMock(side_effect=self._register_panel)
        self.async_remove_panel = MagicMock(side_effect=self._remove_panel)
        self.add_extra_js_url = MagicMock(
            side_effect=lambda hass, url: self.extra_js_urls.append(url)
        )

    def _register_panel(
        self,
        hass,
        frontend_url_path,
        webcomponent_name=None,
        sidebar_title=None,
        sidebar_icon=None,
        config=None,
        **kwargs,
    ):
        self.panels[frontend_url_path] = {
            "webcomponent_name": webcomponent_name,
            "sidebar_title": sidebar_title,
            "sidebar_icon": sidebar_icon,
            "config": config,
        }

    def _remove_panel(self, hass, frontend_url_path):
        self.panels.pop(frontend_url_path, None)


class MockLovelaceResources:
    """Mock Lovelace resource collection."""

    def __init__(self, initial_items=None) -> None:
        self._items = initial_items or []
        self.loaded = True
        self.async_load = AsyncMock()
        self.async_create_item = AsyncMock(side_effect=self._create_item)

    async def _create_item(self, data):
        self._items.append(data)
        return data

    def async_items(self):
        return list(self._items)


@pytest.fixture
def mock_hass():
    """Create a mock HomeAssistant instance."""
    hass = MagicMock()
    hass.data = {}
    hass.client_session = MagicMock()
    hass.http = MockHttp()
    frontend = MockFrontend()
    hass.components = MagicMock()
    hass.components.frontend = frontend
    hass.data["frontend"] = frontend
    hass.data["lovelace"] = MagicMock()
    hass.data["lovelace"].resources = MockLovelaceResources()
    hass.config_entries = MagicMock()
    hass.config_entries.async_forward_entry_setups = AsyncMock(return_value=True)
    hass.config_entries.async_unload_platforms = AsyncMock(return_value=True)
    return hass


@pytest.mark.asyncio
async def test_register_frontend_static_path(mock_hass):
    """Test that static path for frontend is registered."""
    await async_register_frontend(mock_hass)

    # Verify static path registered
    assert len(mock_hass.http.static_paths) > 0
    registered = mock_hass.http.static_paths[0]
    if hasattr(registered, "url_path"):
        assert registered.url_path == URL_BASE
        assert Path(registered.path).exists()
    else:
        assert registered[0] == URL_BASE


@pytest.mark.asyncio
async def test_register_frontend_fallback_register_static_path(mock_hass):
    """Test static path registration fallback when async_register_static_paths is absent."""
    del mock_hass.http.async_register_static_paths
    await async_register_frontend(mock_hass)

    assert mock_hass.http.register_static_path.called
    args = mock_hass.http.register_static_path.call_args[0]
    assert args[0] == URL_BASE
    assert Path(args[1]).exists()


@pytest.mark.asyncio
async def test_register_frontend_sidebar_panel(mock_hass):
    """Test that sidebar panel is registered with correct title and icon."""
    await async_register_frontend(mock_hass)

    frontend = mock_hass.components.frontend
    assert frontend.async_register_panel.called
    call_kwargs = frontend.async_register_panel.call_args[1]
    assert call_kwargs.get("frontend_url_path") == "vivino_cellar"
    assert call_kwargs.get("webcomponent_name") == "vivino-cellar-card"
    assert call_kwargs.get("sidebar_title") == "Wijnkelder"
    assert call_kwargs.get("sidebar_icon") == "mdi:bottle-wine"


@pytest.mark.asyncio
async def test_register_frontend_lovelace_resource(mock_hass):
    """Test that Lovelace dashboard resource is registered."""
    await async_register_frontend(mock_hass)

    resources = mock_hass.data["lovelace"].resources
    assert resources.async_create_item.called
    resource_data = resources.async_create_item.call_args[0][0]
    assert resource_data["res_type"] == "module"
    assert resource_data["url"] == "/vivino_cellar_frontend/vivino-cellar-card.js"


@pytest.mark.asyncio
async def test_register_frontend_lovelace_resource_already_exists(mock_hass):
    """Test that existing resource is not duplicated."""
    mock_hass.data["lovelace"].resources = MockLovelaceResources(
        initial_items=[
            {
                "res_type": "module",
                "url": "/vivino_cellar_frontend/vivino-cellar-card.js",
            }
        ]
    )

    await async_register_frontend(mock_hass)

    resources = mock_hass.data["lovelace"].resources
    assert not resources.async_create_item.called


@pytest.mark.asyncio
async def test_register_frontend_idempotent(mock_hass):
    """Test that registering frontend multiple times is idempotent."""
    await async_register_frontend(mock_hass)
    call_count = mock_hass.components.frontend.async_register_panel.call_count

    # Second call should be a no-op
    await async_register_frontend(mock_hass)
    assert mock_hass.components.frontend.async_register_panel.call_count == call_count


@pytest.mark.asyncio
async def test_register_frontend_no_lovelace(mock_hass):
    """Test graceful handling when Lovelace is not in hass.data."""
    mock_hass.data.pop("lovelace", None)
    # Should not raise exception
    await async_register_frontend(mock_hass)
    assert mock_hass.components.frontend.async_register_panel.called


@pytest.mark.asyncio
async def test_register_frontend_no_frontend(mock_hass):
    """Test graceful handling when frontend is not present."""
    mock_hass.components = MagicMock(spec=[])
    mock_hass.data.pop("frontend", None)
    # Should not raise exception
    await async_register_frontend(mock_hass)


@pytest.mark.asyncio
async def test_unregister_frontend(mock_hass):
    """Test unregistering panel on unload."""
    await async_register_frontend(mock_hass)
    assert "vivino_cellar" in mock_hass.components.frontend.panels

    await async_unregister_frontend(mock_hass)
    frontend = mock_hass.components.frontend
    assert frontend.async_remove_panel.called
    assert "vivino_cellar" not in frontend.panels


@pytest.mark.asyncio
async def test_setup_and_unload_entry_panel_integration(mock_hass):
    """Test async_setup_entry and async_unload_entry register and unregister panel."""
    entry = MagicMock()
    entry.entry_id = "test_entry_1"
    entry.data = {
        CONF_CELLAR_URL: "https://www.vivino.com/cellars/123",
        CONF_COOKIE: "test_cookie",
    }
    entry.options = {}

    with (
        patch("custom_components.vivino_cellar.VivinoClient"),
        patch(
            "custom_components.vivino_cellar.VivinoCellarCoordinator"
        ) as mock_coord_cls,
    ):
        coord_inst = MagicMock()
        coord_inst.async_config_entry_first_refresh = AsyncMock()
        coord_inst.async_add_listener = MagicMock()
        mock_coord_cls.return_value = coord_inst

        # Setup entry
        success = await async_setup_entry(mock_hass, entry)
        assert success is True
        assert "vivino_cellar" in mock_hass.components.frontend.panels

        # Unload entry
        unload_success = await async_unload_entry(mock_hass, entry)
        assert unload_success is True
        assert "vivino_cellar" not in mock_hass.components.frontend.panels
