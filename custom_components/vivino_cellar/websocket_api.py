"""WebSocket API for the Vivino Cellar integration."""

from __future__ import annotations

from collections.abc import Callable
from datetime import UTC, datetime
import logging
from typing import Any

from .const import (
    CONF_NOW_LIMIT,
    DEFAULT_NOW_LIMIT,
    DEFAULT_TITLE,
    DOMAIN,
    WS_TYPE_CELLAR,
    WS_TYPE_DRINK,
    WS_TYPE_PAIRING,
    WS_TYPE_REFRESH,
    WS_TYPE_SUBSCRIBE,
)
from .coordinator import VivinoCellarCoordinator
from .exceptions import VivinoError
from .window_engine import (
    WINDOW_STATUS_CAN_WAIT,
    WINDOW_STATUS_HOLD,
    WINDOW_STATUS_NEAR_PAST_PEAK,
    WINDOW_STATUS_PAST_PEAK,
    WINDOW_STATUS_READY,
    WINDOW_STATUS_UNKNOWN,
    compute_vintage_window_status,
)

_LOGGER = logging.getLogger(__name__)

try:
    from homeassistant.components import websocket_api
    from homeassistant.core import HomeAssistant, callback
    from homeassistant.helpers import config_validation as cv
    import voluptuous as vol
except ImportError:

    def callback(func: Any) -> Any:  # type: ignore[no-redef]
        """Stub callback decorator."""
        return func

    # Graceful fallback stubs when running in test environment without Home Assistant core
    class HomeAssistant:  # type: ignore[no-redef]
        """Stub HomeAssistant."""

    class cv:  # type: ignore[no-redef]
        """Stub config validation."""

        @staticmethod
        def string(val: Any) -> str:
            if not isinstance(val, str):
                raise vol.Invalid("Not a string")
            return val

        @staticmethod
        def positive_int(val: Any) -> int:
            i = int(val)
            if i <= 0:
                raise vol.Invalid("Must be positive int")
            return i

        @staticmethod
        def ensure_list(val: Any) -> list[Any]:
            if val is None:
                return []
            if isinstance(val, list):
                return val
            return [val]

    class _Marker:
        def __init__(self, schema: Any, default: Any = None) -> None:
            self.schema = schema
            self.default = default

        def __hash__(self) -> int:
            return hash(self.schema)

        def __eq__(self, other: Any) -> bool:
            if isinstance(other, _Marker):
                return self.schema == other.schema
            return self.schema == other

    class vol:  # type: ignore[no-redef]
        """Stub voluptuous module."""

        class Invalid(Exception):
            """Stub Invalid exception."""

        class Schema:
            def __init__(self, schema: Any) -> None:
                self.schema = dict(schema) if isinstance(schema, dict) else schema

            def extend(self, extra_schema: Any) -> vol.Schema:
                new_schema = dict(self.schema) if isinstance(self.schema, dict) else {}
                if isinstance(extra_schema, dict):
                    new_schema.update(extra_schema)
                return vol.Schema(new_schema)

            def __call__(self, data: Any) -> Any:
                if not isinstance(data, dict):
                    raise vol.Invalid("Expected dict")
                return data

        @staticmethod
        def Required(key: str, default: Any = None) -> _Marker:
            return _Marker(key, default)

        @staticmethod
        def Optional(key: str, default: Any = None) -> _Marker:
            return _Marker(key, default)

        @staticmethod
        def All(*validators: Any) -> Any:
            def _validate(v: Any) -> Any:
                for val in validators:
                    if callable(val):
                        v = val(v)
                return v

            return _validate

    class websocket_api:  # type: ignore[no-redef]
        """Stub websocket_api module."""

        ERR_NOT_FOUND = "not_found"
        ERR_UNKNOWN_ERROR = "unknown_error"
        ERR_INVALID_FORMAT = "invalid_format"
        ERR_UNAUTHORIZED = "unauthorized"

        BASE_COMMAND_MESSAGE_SCHEMA = vol.Schema(
            {
                vol.Required("id"): cv.positive_int,
                vol.Required("type"): cv.string,
            }
        )

        @staticmethod
        def websocket_command(schema: Any) -> Callable[[Any], Any]:
            def decorator(func: Any) -> Any:
                func._ws_schema = schema
                return func

            return decorator

        @staticmethod
        def event_message(msg_id: int, event: Any) -> dict[str, Any]:
            return {"id": msg_id, "type": "event", "event": event}

        @staticmethod
        def async_response(func: Any) -> Any:
            func._ws_async_response = True
            return func

        @staticmethod
        def require_admin(func: Any) -> Any:
            func._ws_require_admin = True
            return func

        @staticmethod
        def async_register_command(
            hass: Any,
            command_or_handler: Any,
            handler: Any = None,
            schema: Any = None,
        ) -> None:
            if handler is None:
                actual_handler = command_or_handler
                actual_schema = getattr(actual_handler, "_ws_schema", None)
                cmd_type = None
                if isinstance(actual_schema, dict):
                    for k, v in actual_schema.items():
                        key_name = getattr(k, "schema", k)
                        if key_name == "type":
                            cmd_type = v
                            break
                elif actual_schema and hasattr(actual_schema, "schema"):
                    for k, v in actual_schema.schema.items():
                        key_name = getattr(k, "schema", k)
                        if key_name == "type":
                            cmd_type = v
                            break
            else:
                cmd_type = command_or_handler
                actual_handler = handler
                actual_schema = schema

            if not cmd_type:
                return

            hass.data.setdefault("websocket_api", {})
            hass.data["websocket_api"].setdefault("commands", {})
            hass.data["websocket_api"]["commands"][cmd_type] = {
                "handler": actual_handler,
                "schema": actual_schema,
            }


SCHEMA_WS_CELLAR = {
    vol.Required("type"): WS_TYPE_CELLAR,
    vol.Optional("entry_id"): cv.string,
}

SCHEMA_WS_PAIRING = {
    vol.Required("type"): WS_TYPE_PAIRING,
    vol.Optional("dish"): cv.string,
    vol.Optional("food_ids"): vol.All(cv.ensure_list, [cv.positive_int]),
    vol.Optional("entry_id"): cv.string,
}

SCHEMA_WS_DRINK = {
    vol.Required("type"): WS_TYPE_DRINK,
    vol.Required("bottle_id"): cv.positive_int,
    vol.Optional("vintage_id"): cv.positive_int,
    vol.Optional("entry_id"): cv.string,
}

SCHEMA_WS_SUBSCRIBE = {
    vol.Required("type"): WS_TYPE_SUBSCRIBE,
    vol.Optional("entry_id"): cv.string,
}

SCHEMA_WS_REFRESH = {
    vol.Required("type"): WS_TYPE_REFRESH,
    vol.Optional("entry_id"): cv.string,
}


def _get_coordinator(hass: Any, entry_id: str | None = None) -> VivinoCellarCoordinator:
    """Get targeted coordinator or default coordinator."""
    domain_data = hass.data.get(DOMAIN, {})
    coordinators: dict[str, VivinoCellarCoordinator] = {
        k: v
        for k, v in domain_data.items()
        if isinstance(v, VivinoCellarCoordinator) or hasattr(v, "async_refresh")
    }

    if not coordinators:
        raise VivinoError("Vivino Cellar is not configured.")

    if entry_id:
        if entry_id not in coordinators:
            raise VivinoError(f"Vivino Cellar entry '{entry_id}' not found.")
        return coordinators[entry_id]

    return next(iter(coordinators.values()))


def _get_all_coordinators(hass: Any) -> list[VivinoCellarCoordinator]:
    """Get all configured coordinators."""
    domain_data = hass.data.get(DOMAIN, {})
    return [
        v
        for v in domain_data.values()
        if isinstance(v, VivinoCellarCoordinator) or hasattr(v, "async_refresh")
    ]


_STATUS_ORDER = (
    WINDOW_STATUS_READY,
    WINDOW_STATUS_CAN_WAIT,
    WINDOW_STATUS_HOLD,
    WINDOW_STATUS_NEAR_PAST_PEAK,
    WINDOW_STATUS_PAST_PEAK,
    WINDOW_STATUS_UNKNOWN,
)


def _last_refresh_iso(coordinator: Any) -> str | None:
    """Return the coordinator's last refresh time as ISO string."""
    last = getattr(coordinator, "last_refresh_time", None)
    if isinstance(last, str):
        return last
    if not isinstance(last, datetime):
        last = getattr(coordinator, "last_update_success_time", None)
    return last.isoformat() if isinstance(last, datetime) else None


def _build_cellar_payload(coordinator: Any) -> dict[str, Any]:
    """Build the cellar payload shared by the cellar command and subscription."""
    cellar_data = coordinator.data
    current_year = datetime.now(UTC).year
    wines: list[dict[str, Any]] = []
    grouped: dict[str, list[dict[str, Any]]] = {s: [] for s in _STATUS_ORDER}

    for vintage in cellar_data.vintages if cellar_data else []:
        status = compute_vintage_window_status(vintage, current_year)
        bottles_list = [
            {
                "bottle_id": b.id,
                "id": b.id,
                "size_id": b.size_id,
                "storage_location_id": b.storage_location_id,
                "location_name": b.location_name,
                "bin": b.bin,
                "created_at": b.created_at,
            }
            for b in vintage.bottles
        ]
        wine_item = {
            "vintage_id": vintage.id,
            "id": vintage.id,
            "name": vintage.name,
            "winery": vintage.winery,
            "year": vintage.year,
            "region": vintage.region,
            "country": vintage.country,
            "type_id": vintage.type_id,
            "grapes": list(vintage.grapes or []),
            "style": vintage.style.name if vintage.style else None,
            "rating": vintage.rating,
            "ratings_count": vintage.ratings_count,
            "image_url": vintage.image_url,
            "start_year": vintage.start_year,
            "end_year": vintage.end_year,
            "window_source": vintage.window_source,
            "window_status": status,
            "bottle_count": len(bottles_list),
            "bottles": bottles_list,
            "foods": [
                {
                    "id": f.id,
                    "name": f.name,
                    "seo_name": f.seo_name,
                    "weight": f.weight,
                }
                for f in vintage.foods
            ],
        }
        wines.append(wine_item)
        grouped.setdefault(status, []).append(wine_item)

    settings = getattr(coordinator, "settings", None) or {}
    return {
        "cellar_id": cellar_data.cellar_id if cellar_data else None,
        "settings": {
            "title": settings.get("title") or DEFAULT_TITLE,
            "now_limit": settings.get(CONF_NOW_LIMIT) or DEFAULT_NOW_LIMIT,
        },
        "total_bottles": sum(w["bottle_count"] for w in wines),
        "last_refresh_time": _last_refresh_iso(coordinator),
        "last_update_success": bool(getattr(coordinator, "last_update_success", True)),
        "food_categories": [
            {"id": cat.id, "name": cat.name, "seo_name": cat.seo_name}
            for cat in (cellar_data.food_categories if cellar_data else [])
        ],
        "wines": wines,
        "grouped_wines": grouped,
        "status_counts": {
            status: sum(w["bottle_count"] for w in wine_list)
            for status, wine_list in grouped.items()
        },
    }


@websocket_api.websocket_command(SCHEMA_WS_CELLAR)
@websocket_api.async_response
async def ws_cellar(
    hass: HomeAssistant,
    connection: Any,
    msg: dict[str, Any],
) -> None:
    """Handle vivino_cellar/cellar websocket command."""
    try:
        coordinator = _get_coordinator(hass, msg.get("entry_id"))
    except VivinoError as err:
        connection.send_error(msg["id"], websocket_api.ERR_NOT_FOUND, str(err))
        return

    connection.send_result(msg["id"], _build_cellar_payload(coordinator))


@websocket_api.websocket_command(SCHEMA_WS_SUBSCRIBE)
@callback
def ws_subscribe(
    hass: HomeAssistant,
    connection: Any,
    msg: dict[str, Any],
) -> None:
    """Push the cellar payload now and after every coordinator update."""
    try:
        coordinator = _get_coordinator(hass, msg.get("entry_id"))
    except VivinoError as err:
        connection.send_error(msg["id"], websocket_api.ERR_NOT_FOUND, str(err))
        return

    msg_id = msg["id"]

    @callback
    def _push() -> None:
        connection.send_message(
            websocket_api.event_message(msg_id, _build_cellar_payload(coordinator))
        )

    connection.subscriptions[msg_id] = coordinator.async_add_listener(_push)
    connection.send_result(msg_id)
    _push()


@websocket_api.websocket_command(SCHEMA_WS_PAIRING)
@websocket_api.async_response
async def ws_pairing(
    hass: HomeAssistant,
    connection: Any,
    msg: dict[str, Any],
) -> None:
    """Handle vivino_cellar/pairing websocket command."""
    dish = msg.get("dish")
    food_ids = msg.get("food_ids")

    has_dish = bool(dish and str(dish).strip())
    has_food_ids = bool(food_ids)

    if (has_dish and has_food_ids) or (not has_dish and not has_food_ids):
        connection.send_error(
            msg["id"],
            websocket_api.ERR_INVALID_FORMAT,
            "Exactly one of 'dish' or 'food_ids' must be provided.",
        )
        return

    clean_dish = str(dish).strip() if has_dish else None
    clean_food_ids = [int(f) for f in food_ids] if has_food_ids else None

    try:
        coordinator = _get_coordinator(hass, msg.get("entry_id"))
    except VivinoError as err:
        connection.send_error(msg["id"], websocket_api.ERR_NOT_FOUND, str(err))
        return

    try:
        results = await coordinator.async_suggest_pairing(
            dish=clean_dish,
            food_ids=clean_food_ids,
        )
    except VivinoError as err:
        connection.send_error(msg["id"], "pairing_failed", str(err))
        return
    except Exception as err:  # noqa: BLE001
        _LOGGER.error("Error executing pairing via WebSocket: %s", err)
        connection.send_error(msg["id"], websocket_api.ERR_UNKNOWN_ERROR, str(err))
        return

    matches = []
    for result in results:
        vintage = result.vintage
        matches.append(
            {
                "vintage_id": vintage.id,
                "name": vintage.name,
                "winery": vintage.winery,
                "year": vintage.year,
                "rating": vintage.rating,
                "image_url": vintage.image_url,
                "region": vintage.region,
                "country": vintage.country,
                "match_score": result.match_score,
                "window_status": result.window_status,
                "explanation": result.explanation,
                "bottles": [
                    {
                        "bottle_id": b.id,
                        "id": b.id,
                        "storage_location_id": b.storage_location_id,
                        "location_name": b.location_name,
                        "bin": b.bin,
                    }
                    for b in vintage.bottles
                ],
            }
        )

    connection.send_result(msg["id"], {"matches": matches})


@websocket_api.websocket_command(SCHEMA_WS_DRINK)
@websocket_api.async_response
async def ws_drink(
    hass: HomeAssistant,
    connection: Any,
    msg: dict[str, Any],
) -> None:
    """Handle vivino_cellar/drink websocket command."""
    bottle_id = msg.get("bottle_id")
    if bottle_id is None:
        connection.send_error(
            msg["id"],
            websocket_api.ERR_INVALID_FORMAT,
            "bottle_id is required.",
        )
        return

    try:
        clean_bottle_id = int(bottle_id)
    except (TypeError, ValueError):
        connection.send_error(
            msg["id"],
            websocket_api.ERR_INVALID_FORMAT,
            f"Invalid bottle_id: {bottle_id}",
        )
        return

    clean_vintage_id = None
    if msg.get("vintage_id") is not None:
        try:
            clean_vintage_id = int(msg["vintage_id"])
        except (TypeError, ValueError):
            connection.send_error(
                msg["id"],
                websocket_api.ERR_INVALID_FORMAT,
                f"Invalid vintage_id: {msg['vintage_id']}",
            )
            return

    try:
        coordinator = _get_coordinator(hass, msg.get("entry_id"))
    except VivinoError as err:
        connection.send_error(msg["id"], websocket_api.ERR_NOT_FOUND, str(err))
        return

    try:
        await coordinator.async_drink_bottle(
            bottle_id=clean_bottle_id,
            vintage_id=clean_vintage_id,
        )
    except VivinoError as err:
        connection.send_error(msg["id"], "drink_failed", str(err))
        return
    except Exception as err:  # noqa: BLE001
        _LOGGER.error(
            "Error drinking bottle %s via WebSocket: %s", clean_bottle_id, err
        )
        connection.send_error(msg["id"], websocket_api.ERR_UNKNOWN_ERROR, str(err))
        return

    connection.send_result(msg["id"], {"success": True})


@websocket_api.websocket_command(SCHEMA_WS_REFRESH)
@websocket_api.async_response
async def ws_refresh(
    hass: HomeAssistant,
    connection: Any,
    msg: dict[str, Any],
) -> None:
    """Handle vivino_cellar/refresh websocket command."""
    entry_id = msg.get("entry_id")

    try:
        if entry_id:
            coord = _get_coordinator(hass, entry_id)
            await coord.async_refresh()
        else:
            coordinators = _get_all_coordinators(hass)
            if not coordinators:
                connection.send_error(
                    msg["id"],
                    websocket_api.ERR_NOT_FOUND,
                    "Vivino Cellar is not configured.",
                )
                return
            for coord in coordinators:
                await coord.async_refresh()
    except VivinoError as err:
        connection.send_error(msg["id"], websocket_api.ERR_NOT_FOUND, str(err))
        return
    except Exception as err:  # noqa: BLE001
        _LOGGER.error("Error executing refresh via WebSocket: %s", err)
        connection.send_error(msg["id"], websocket_api.ERR_UNKNOWN_ERROR, str(err))
        return

    connection.send_result(msg["id"], {"success": True})


def async_unregister_command(hass: Any, command_type: str) -> None:
    """Unregister a websocket command."""
    if hasattr(websocket_api, "async_remove_command"):
        websocket_api.async_remove_command(hass, command_type)
        return

    if hasattr(hass, "data") and "websocket_api" in hass.data:
        ws_data = hass.data["websocket_api"]
        if hasattr(ws_data, "commands") and isinstance(ws_data.commands, dict):
            ws_data.commands.pop(command_type, None)
        elif isinstance(ws_data, dict) and "commands" in ws_data:
            ws_data["commands"].pop(command_type, None)


async def async_setup_websocket_api(hass: Any) -> None:
    """Register Vivino Cellar WebSocket API commands."""
    websocket_api.async_register_command(hass, ws_cellar)
    websocket_api.async_register_command(hass, ws_pairing)
    websocket_api.async_register_command(hass, ws_drink)
    websocket_api.async_register_command(hass, ws_refresh)
    websocket_api.async_register_command(hass, ws_subscribe)


async def async_unload_websocket_api(hass: Any) -> None:
    """Unregister Vivino Cellar WebSocket API commands."""
    for cmd_type in (
        WS_TYPE_CELLAR,
        WS_TYPE_PAIRING,
        WS_TYPE_DRINK,
        WS_TYPE_REFRESH,
        WS_TYPE_SUBSCRIBE,
    ):
        async_unregister_command(hass, cmd_type)
