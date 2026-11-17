"""Backend texts in Home Assistant's language.

Texts that HA cannot translate on its own (the sidebar title, dynamic form
labels) live under "common" in translations/<lang>.json and are looked up in
hass.config.language. English below is the fallback.
"""

from __future__ import annotations

import logging
from typing import Any

from .const import DEFAULT_TITLE, DOMAIN

_LOGGER = logging.getLogger(__name__)

CATEGORY = "common"

FALLBACK: dict[str, str] = {
    "panel_title": DEFAULT_TITLE,
    "location_field_one": "Location {id} · {count} bottle",
    "location_field_other": "Location {id} · {count} bottles",
}


async def _async_load(hass: Any, language: str) -> dict[str, str]:
    """Flat HA translations for this integration's CATEGORY."""
    from homeassistant.helpers.translation import (
        async_get_translations,
    )

    return await async_get_translations(hass, language, CATEGORY, {DOMAIN})


async def async_texts(hass: Any) -> dict[str, str]:
    """All "common" texts in HA's language; English for anything missing."""
    texts = dict(FALLBACK)
    language = getattr(getattr(hass, "config", None), "language", None)
    if not isinstance(language, str) or not language:
        return texts
    try:
        found = await _async_load(hass, language)
    except Exception as err:  # noqa: BLE001
        _LOGGER.debug("No translations for %s: %s", language, err)
        return texts
    prefix = f"component.{DOMAIN}.{CATEGORY}."
    for key, value in (found or {}).items():
        if key.startswith(prefix) and isinstance(value, str) and value:
            texts[key.removeprefix(prefix)] = value
    return texts


def plural(texts: dict[str, str], key: str, count: int, **params: Any) -> str:
    """Format `<key>_one` or `<key>_other` (enough for English and Dutch)."""
    form = "one" if count == 1 else "other"
    template = texts.get(f"{key}_{form}") or FALLBACK[f"{key}_{form}"]
    return template.format(count=count, **params)
