"""Diagnostics support for Vivino Cellar."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from .const import CONF_COOKIE, DOMAIN
from .window_engine import compute_vintage_window_status

try:
    from homeassistant.components.diagnostics import async_redact_data
    from homeassistant.config_entries import ConfigEntry
    from homeassistant.core import HomeAssistant
except ImportError:
    # Fallback when running tests without homeassistant installed
    class ConfigEntry:  # type: ignore[no-redef]
        """Stub ConfigEntry."""

        entry_id: str
        data: dict[str, Any]
        options: dict[str, Any]

    class HomeAssistant:  # type: ignore[no-redef]
        """Stub HomeAssistant."""

        data: dict[str, Any]

    def async_redact_data(data: Any, to_redact: Any) -> Any:  # type: ignore[no-redef]
        """Redact sensitive keys from data."""
        if isinstance(data, dict):
            return {
                k: "**REDACTED**" if k in to_redact else async_redact_data(v, to_redact)
                for k, v in data.items()
            }
        if isinstance(data, list):
            return [async_redact_data(item, to_redact) for item in data]
        return data


TO_REDACT = {
    CONF_COOKIE,
    "cookie",
    "_ruby-web_session",
    "password",
    "token",
    "access_token",
    "refresh_token",
    "api_key",
    "secret",
    "session",
    "email",
    "username",
    "user_id",
}


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant, entry: ConfigEntry
) -> dict[str, Any]:
    """Return diagnostics for a config entry."""
    coordinator = hass.data.get(DOMAIN, {}).get(entry.entry_id)

    diagnostics_data: dict[str, Any] = {
        "entry": {
            "entry_id": entry.entry_id,
            "version": getattr(entry, "version", 1),
            "domain": getattr(entry, "domain", DOMAIN),
            "title": getattr(entry, "title", "Vivino Cellar"),
            "data": async_redact_data(dict(entry.data), TO_REDACT),
            "options": async_redact_data(
                dict(getattr(entry, "options", {})), TO_REDACT
            ),
        },
    }

    if coordinator is not None:
        cellar_data = getattr(coordinator, "data", None)
        coord_diag: dict[str, Any] = {
            "last_update_success": getattr(coordinator, "last_update_success", True),
            "ai_task_entity": getattr(coordinator, "ai_task_entity", None),
            "stored_ai_windows_count": len(
                getattr(
                    coordinator,
                    "_ai_estimates",
                    getattr(coordinator, "_stored_ai_windows", {}),
                )
            ),
        }
        if cellar_data and cellar_data.vintages is not None:
            current_year = datetime.now().year
            total_bottles = sum(len(v.bottles) for v in cellar_data.vintages)
            coord_diag["cellar"] = {
                "cellar_id": cellar_data.cellar_id,
                "locale": cellar_data.locale,
                "total_bottles": total_bottles,
                "total_unique_wines": len(cellar_data.vintages),
                "vintages_count": len(cellar_data.vintages),
                "food_categories_count": len(cellar_data.food_categories),
                "vintages": [
                    {
                        "id": v.id,
                        "year": v.year,
                        "name": v.name,
                        "winery": v.winery,
                        "region": v.region,
                        "country": v.country,
                        "type_id": v.type_id,
                        "bottle_count": len(v.bottles),
                        "window_status": compute_vintage_window_status(
                            v, current_year
                        ),
                        "window_source": v.window_source,
                        "start_year": v.start_year,
                        "end_year": v.end_year,
                        "ratings_count": v.ratings_count,
                        "ratings_average": v.rating,
                    }
                    for v in cellar_data.vintages
                ],
            }
        diagnostics_data["coordinator"] = coord_diag

    return async_redact_data(diagnostics_data, TO_REDACT)
