"""Tests for naming Vivino storage locations (Vivino's web data only has ids)."""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from custom_components.vivino_cellar.config_flow import VivinoCellarOptionsFlow
from custom_components.vivino_cellar.const import (
    CONF_LOCATION_NAMES,
    CONF_NOW_LIMIT,
    CONF_SCAN_INTERVAL,
    CONF_SHOW_PANEL,
    DOMAIN,
    cellar_settings,
)
from custom_components.vivino_cellar.i18n import FALLBACK
from custom_components.vivino_cellar.locations import (
    apply_location_names,
    location_counts,
)
from custom_components.vivino_cellar.models import Bottle, CellarData, Vintage


def _bottle(bid, loc_id, name=""):
    return Bottle(
        id=bid,
        size_id=1,
        storage_location_id=loc_id,
        location_name=name,
        bin=None,
        created_at="",
    )


def _cellar(*bottles):
    vintage = Vintage(
        id=1,
        year=2020,
        name="Wijn",
        winery="Huis",
        region="",
        country="",
        type_id=1,
        grapes=[],
        image_url=None,
        rating=None,
        ratings_count=0,
        foods=[],
        style=None,
        bottles=list(bottles),
        start_year=None,
        end_year=None,
        window_source="none",
    )
    return CellarData(
        cellar_id="1",
        locale="nl",
        total_count=len(bottles),
        vintages=[vintage],
        food_categories=[],
    )


def _names(data):
    return [b.location_name for b in data.vintages[0].bottles]


def _numbers(data):
    return [b.location_number for b in data.vintages[0].bottles]


def test_named_locations_use_the_users_names():
    data = _cellar(_bottle(1, 58028), _bottle(2, 61000))
    apply_location_names(data, {"58028": "Kelder", "61000": "Koelkast"})
    assert _names(data) == ["Kelder", "Koelkast"]
    assert _numbers(data) == [1, 2]


def test_unnamed_locations_are_numbered_by_id():
    data = _cellar(_bottle(1, 61000), _bottle(2, 58028), _bottle(3, 61000))
    apply_location_names(data, {})
    assert _names(data) == ["", "", ""]
    assert _numbers(data) == [2, 1, 2]


def test_name_from_vivino_is_kept_when_not_renamed():
    data = _cellar(_bottle(1, 5, "Wijnkast"), _bottle(2, 6))
    apply_location_names(data, {"6": "Kelder"})
    assert _names(data) == ["Wijnkast", "Kelder"]


def test_bottle_without_location():
    data = _cellar(_bottle(1, None))
    apply_location_names(data, {})
    assert _names(data) == [""]
    assert _numbers(data) == [None]


def test_blank_name_counts_as_unnamed():
    data = _cellar(_bottle(1, 58028))
    apply_location_names(data, {"58028": "  "})
    assert _names(data) == [""]
    assert _numbers(data) == [1]


def test_location_counts():
    data = _cellar(
        _bottle(1, 61000), _bottle(2, 58028), _bottle(3, 61000), _bottle(4, None)
    )
    assert location_counts(data) == {58028: 1, 61000: 2}


def test_settings_include_location_names():
    entry = MagicMock()
    entry.title = "Kelder"
    entry.data = {}
    entry.options = {CONF_LOCATION_NAMES: {"58028": "Kelder"}}
    assert cellar_settings(entry)[CONF_LOCATION_NAMES] == {"58028": "Kelder"}
    entry.options = {}
    assert cellar_settings(entry)[CONF_LOCATION_NAMES] == {}


# --- Configure (options flow) --------------------------------------------------


def _flow(cellar=None, options=None):
    flow = VivinoCellarOptionsFlow()
    entry = MagicMock()
    entry.entry_id = "e1"
    entry.title = "Kelder"
    entry.data = {}
    entry.options = options or {}
    flow.config_entry = entry
    coordinator = MagicMock()
    coordinator.data = cellar
    flow.hass = MagicMock()
    flow.hass.data = {DOMAIN: {"e1": coordinator}}
    return flow


SETTINGS = {CONF_SCAN_INTERVAL: 6, CONF_SHOW_PANEL: True, CONF_NOW_LIMIT: 5}


async def test_configure_asks_for_location_names_after_settings():
    flow = _flow(_cellar(_bottle(1, 58028), _bottle(2, 58028), _bottle(3, 61000)))
    result = await flow.async_step_init(dict(SETTINGS))
    assert result["type"] == "form"
    assert result["step_id"] == "locations"
    labels = [str(getattr(k, "schema", k)) for k in result["data_schema"].schema]
    assert labels == ["Location 58028 · 2 bottles", "Location 61000 · 1 bottle"]


async def test_configure_saves_location_names():
    flow = _flow(_cellar(_bottle(1, 58028), _bottle(2, 61000)))
    await flow.async_step_init(dict(SETTINGS))
    result = await flow.async_step_locations(
        {"Location 58028 · 1 bottle": " Kelder ", "Location 61000 · 1 bottle": ""}
    )
    assert result["type"] == "create_entry"
    assert result["data"][CONF_LOCATION_NAMES] == {"58028": "Kelder"}
    assert result["data"][CONF_SCAN_INTERVAL] == 6


async def test_configure_skips_locations_step_without_cellar_data():
    flow = _flow(None, options={CONF_LOCATION_NAMES: {"58028": "Kelder"}})
    result = await flow.async_step_init(dict(SETTINGS))
    assert result["type"] == "create_entry"
    # Existing names survive a settings-only save.
    assert result["data"][CONF_LOCATION_NAMES] == {"58028": "Kelder"}


@pytest.mark.parametrize("count,word", [(1, "bottle"), (3, "bottles")])
async def test_location_label_grammar(count, word):
    bottles = [_bottle(i, 7) for i in range(count)]
    flow = _flow(_cellar(*bottles))
    result = await flow.async_step_init(dict(SETTINGS))
    labels = [str(getattr(k, "schema", k)) for k in result["data_schema"].schema]
    assert labels == [f"Location 7 · {count} {word}"]


def _ha_translations(lang):
    """What HA's async_get_translations returns for our "common" category."""
    path = (
        Path(__file__).parents[1]
        / f"custom_components/vivino_cellar/translations/{lang}.json"
    )
    common = json.loads(path.read_text())["common"]
    return {f"component.{DOMAIN}.common.{k}": v for k, v in common.items()}


@pytest.mark.parametrize(
    "count,label", [(1, "Locatie 7 · 1 fles"), (3, "Locatie 7 · 3 flessen")]
)
async def test_location_labels_follow_ha_language(count, label):
    flow = _flow(_cellar(*[_bottle(i, 7) for i in range(count)]))
    flow.hass.config.language = "nl"
    load = AsyncMock(return_value=_ha_translations("nl"))
    with patch("custom_components.vivino_cellar.i18n._async_load", load):
        result = await flow.async_step_init(dict(SETTINGS))
    labels = [str(getattr(k, "schema", k)) for k in result["data_schema"].schema]
    assert labels == [label]
    assert load.await_args.args[1] == "nl"


@pytest.mark.parametrize("lang", ["en", "nl"])
def test_common_translations_match_the_fallback(lang):
    keys = {k.rsplit(".", 1)[1] for k in _ha_translations(lang)}
    assert keys == set(FALLBACK)
    if lang == "en":
        assert {
            k.rsplit(".", 1)[1]: v for k, v in _ha_translations(lang).items()
        } == FALLBACK
