"""Tests for cellar settings: options flow, cellar name, and how they are applied."""

from __future__ import annotations

from datetime import timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from custom_components.vivino_cellar import (
    _async_update_listener,
    async_setup_entry,
)
from custom_components.vivino_cellar.config_flow import (
    VivinoCellarConfigFlow,
    VivinoCellarOptionsFlow,
)
from custom_components.vivino_cellar.const import (
    CONF_AI_TASK,
    CONF_CELLAR_URL,
    CONF_COOKIE,
    CONF_NOW_LIMIT,
    CONF_SCAN_INTERVAL,
    CONF_SHOW_PANEL,
    DEFAULT_NOW_LIMIT,
    DEFAULT_SCAN_INTERVAL,
    DEFAULT_TITLE,
    cellar_settings,
    cellar_title,
)
from custom_components.vivino_cellar.websocket_api import _build_cellar_payload


def _entry(title="Vivino Cellar (651553)", options=None, data=None):
    entry = MagicMock()
    entry.entry_id = "entry1"
    entry.title = title
    entry.options = options or {}
    entry.data = data or {
        CONF_CELLAR_URL: "https://www.vivino.com/cellars/651553",
        CONF_COOKIE: "cookie",
    }
    return entry


@pytest.mark.parametrize(
    ("title", "expected"),
    [
        ("Vivino Cellar (651553)", DEFAULT_TITLE),
        ("", DEFAULT_TITLE),
        (None, DEFAULT_TITLE),
        ("Kelder Kerkstraat", "Kelder Kerkstraat"),
        ("  Kelder  ", "Kelder"),
    ],
)
def test_cellar_title(title, expected):
    """The default entry title falls back to Wijnkelder; a rename wins."""
    assert cellar_title(_entry(title=title)) == expected


def test_cellar_settings_defaults():
    """Unset options use the defaults."""
    settings = cellar_settings(_entry())
    assert settings == {
        "title": DEFAULT_TITLE,
        CONF_AI_TASK: None,
        CONF_SCAN_INTERVAL: DEFAULT_SCAN_INTERVAL,
        CONF_SHOW_PANEL: True,
        CONF_NOW_LIMIT: DEFAULT_NOW_LIMIT,
        "location_names": {},
        "weather_entity": None,
    }


def test_cellar_settings_ai_task_falls_back_to_setup_data():
    """An AI task picked at first setup still applies until options override it."""
    entry = _entry(data={CONF_AI_TASK: "ai_task.setup"})
    assert cellar_settings(entry)[CONF_AI_TASK] == "ai_task.setup"
    entry.options = {CONF_AI_TASK: "ai_task.options"}
    assert cellar_settings(entry)[CONF_AI_TASK] == "ai_task.options"
    entry.options = {CONF_AI_TASK: None}  # cleared on the Configure screen
    assert cellar_settings(entry)[CONF_AI_TASK] is None


def test_options_flow_registered():
    """The config flow exposes the options flow (the Configure button)."""
    flow = VivinoCellarConfigFlow.async_get_options_flow(_entry())
    assert isinstance(flow, VivinoCellarOptionsFlow)


@pytest.mark.asyncio
async def test_options_flow_shows_form():
    flow = VivinoCellarOptionsFlow()
    flow.config_entry = _entry()
    result = await flow.async_step_init()
    assert result["type"] == "form"
    assert result["step_id"] == "init"


@pytest.mark.asyncio
async def test_options_flow_saves_input():
    flow = VivinoCellarOptionsFlow()
    flow.config_entry = _entry()
    user_input = {
        CONF_AI_TASK: "ai_task.openai",
        CONF_SCAN_INTERVAL: 12,
        CONF_SHOW_PANEL: False,
        CONF_NOW_LIMIT: 8,
        "weather_entity": "weather.home",
    }
    result = await flow.async_step_init(user_input)
    assert result["type"] == "create_entry"
    assert result["data"] == user_input


@pytest.mark.asyncio
async def test_options_flow_coerces_numbers_to_int():
    """Number selectors return floats; store whole numbers."""
    flow = VivinoCellarOptionsFlow()
    flow.config_entry = _entry()
    result = await flow.async_step_init(
        {CONF_SCAN_INTERVAL: 3.0, CONF_SHOW_PANEL: True, CONF_NOW_LIMIT: 10.0}
    )
    assert result["data"][CONF_SCAN_INTERVAL] == 3
    assert result["data"][CONF_NOW_LIMIT] == 10
    assert isinstance(result["data"][CONF_NOW_LIMIT], int)
    # A cleared AI task is stored as None so it overrides the setup value.
    assert result["data"][CONF_AI_TASK] is None
    assert result["data"]["weather_entity"] is None


def test_payload_includes_settings():
    """The card reads its title and list size from the cellar payload."""
    coordinator = MagicMock()
    coordinator.data = None
    coordinator.settings = {"title": "Kelder", CONF_NOW_LIMIT: 7}
    payload = _build_cellar_payload(coordinator)
    assert payload["settings"] == {
        "title": "Kelder",
        "now_limit": 7,
        "weather_entity": None,
    }
    coordinator.settings["weather_entity"] = "weather.home"
    assert _build_cellar_payload(coordinator)["settings"]["weather_entity"] == (
        "weather.home"
    )


def _setup_patches():
    return (
        patch("custom_components.vivino_cellar.VivinoClient"),
        patch("custom_components.vivino_cellar.VivinoCellarCoordinator"),
        patch(
            "custom_components.vivino_cellar.async_register_frontend",
            new_callable=AsyncMock,
        ),
        patch(
            "custom_components.vivino_cellar.async_setup_services",
            new_callable=AsyncMock,
        ),
        patch(
            "custom_components.vivino_cellar.async_setup_intents",
            new_callable=AsyncMock,
        ),
        patch(
            "custom_components.vivino_cellar.async_setup_websocket_api",
            new_callable=AsyncMock,
        ),
    )


def _hass():
    hass = MagicMock()
    hass.data = {}
    hass.config_entries.async_forward_entry_setups = AsyncMock(return_value=True)
    hass.config_entries.async_reload = AsyncMock()
    return hass


@pytest.mark.asyncio
async def test_setup_applies_options():
    """Interval, AI task, title and panel visibility come from the options."""
    entry = _entry(
        title="Kelder",
        options={
            CONF_AI_TASK: "ai_task.x",
            CONF_SCAN_INTERVAL: 2,
            CONF_SHOW_PANEL: False,
            CONF_NOW_LIMIT: 9,
        },
    )
    hass = _hass()
    p_client, p_coord, p_front, *rest = _setup_patches()
    with p_client, p_coord as coord_cls, p_front as register, rest[0], rest[1], rest[2]:
        coord = coord_cls.return_value
        coord.async_config_entry_first_refresh = AsyncMock()
        assert await async_setup_entry(hass, entry)

    kwargs = coord_cls.call_args.kwargs
    assert kwargs["ai_task_entity"] == "ai_task.x"
    assert kwargs["update_interval"] == timedelta(hours=2)
    assert coord.settings["title"] == "Kelder"
    assert coord.settings[CONF_NOW_LIMIT] == 9
    register.assert_awaited_once_with(hass, title="Kelder", show_panel=False)
    entry.add_update_listener.assert_called_once_with(_async_update_listener)


@pytest.mark.asyncio
async def test_update_listener_reloads_on_settings_change():
    """A rename or options change reloads the entry."""
    entry = _entry(title="Oud")
    hass = _hass()
    coordinator = MagicMock()
    coordinator.settings = cellar_settings(entry)
    hass.data = {"vivino_cellar": {"entry1": coordinator}}

    entry.title = "Nieuw"
    await _async_update_listener(hass, entry)
    hass.config_entries.async_reload.assert_awaited_once_with("entry1")


@pytest.mark.asyncio
async def test_update_listener_ignores_cookie_rotation():
    """A rotated cookie updates entry.data but must not reload the entry."""
    entry = _entry(title="Kelder")
    hass = _hass()
    coordinator = MagicMock()
    coordinator.settings = cellar_settings(entry)
    hass.data = {"vivino_cellar": {"entry1": coordinator}}

    entry.data = {**entry.data, CONF_COOKIE: "rotated"}
    await _async_update_listener(hass, entry)
    hass.config_entries.async_reload.assert_not_awaited()
