"""Constants for the Vivino Cellar integration."""

from __future__ import annotations

import re
from typing import Any

DOMAIN = "vivino_cellar"

CONF_CELLAR_URL = "cellar_url"
CONF_COOKIE = "cookie"
CONF_AI_TASK = "ai_task"

# Options (the integration's Configure screen)
CONF_SCAN_INTERVAL = "scan_interval_hours"
CONF_SHOW_PANEL = "show_panel"
CONF_NOW_LIMIT = "now_limit"
# {"<storage_location_id>": "name"}; Vivino's web data has no location names
CONF_LOCATION_NAMES = "location_names"

DEFAULT_TITLE = "Wijnkelder"
DEFAULT_SCAN_INTERVAL = 6
DEFAULT_NOW_LIMIT = 5

# Title HA gives a new entry; shown as DEFAULT_TITLE until the user renames it.
_DEFAULT_ENTRY_TITLE = re.compile(r"^Vivino Cellar \(.*\)$")


def cellar_title(entry: Any) -> str:
    """Return the cellar name: the entry title, unless it is still the default."""
    title = getattr(entry, "title", None)
    if not isinstance(title, str) or not title.strip():
        return DEFAULT_TITLE
    title = title.strip()
    return DEFAULT_TITLE if _DEFAULT_ENTRY_TITLE.match(title) else title


def cellar_settings(entry: Any) -> dict[str, Any]:
    """Resolve every user setting for an entry, with defaults applied."""
    options = getattr(entry, "options", None) or {}
    data = getattr(entry, "data", None) or {}
    # Saved options win, even when the AI task was cleared there on purpose.
    ai_task = (
        options[CONF_AI_TASK] if CONF_AI_TASK in options else data.get(CONF_AI_TASK)
    )
    return {
        "title": cellar_title(entry),
        CONF_AI_TASK: ai_task or None,
        CONF_SCAN_INTERVAL: int(options.get(CONF_SCAN_INTERVAL, DEFAULT_SCAN_INTERVAL)),
        CONF_SHOW_PANEL: bool(options.get(CONF_SHOW_PANEL, True)),
        CONF_NOW_LIMIT: int(options.get(CONF_NOW_LIMIT, DEFAULT_NOW_LIMIT)),
        CONF_LOCATION_NAMES: dict(options.get(CONF_LOCATION_NAMES) or {}),
    }


def parse_rating(value: Any) -> float:
    """A Vivino rating: 1 to 5 in half stars. Raises ValueError otherwise."""
    try:
        rating = float(value)
    except (TypeError, ValueError) as err:
        raise ValueError(f"Rating must be a number, got {value!r}") from err
    if not 1 <= rating <= 5 or (rating * 2) % 1:
        raise ValueError("Rating must be between 1 and 5 in half stars")
    return rating


# Services (Actions)
SERVICE_SUGGEST_PAIRING = "suggest_pairing"
SERVICE_DRINK_BOTTLE = "drink_bottle"
SERVICE_REFRESH = "refresh"
SERVICE_RATE_WINE = "rate_wine"

# Assist Voice Intent
INTENT_SUGGEST_WINE = "VivinoCellarSuggestWine"

# WebSocket API Commands
WS_TYPE_CELLAR = "vivino_cellar/cellar"
WS_TYPE_PAIRING = "vivino_cellar/pairing"
WS_TYPE_DRINK = "vivino_cellar/drink"
WS_TYPE_REFRESH = "vivino_cellar/refresh"
WS_TYPE_SUBSCRIBE = "vivino_cellar/subscribe"
WS_TYPE_RATING = "vivino_cellar/rating"
WS_TYPE_RATE = "vivino_cellar/rate"
