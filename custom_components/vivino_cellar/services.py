"""Services (actions) for the Vivino Cellar integration."""

from __future__ import annotations

import logging
from typing import Any

from .const import (
    DOMAIN,
    SERVICE_DRINK_BOTTLE,
    SERVICE_RATE_WINE,
    SERVICE_REFRESH,
    SERVICE_SUGGEST_PAIRING,
    parse_rating,
)
from .coordinator import VivinoCellarCoordinator

_LOGGER = logging.getLogger(__name__)

try:
    from homeassistant.core import (
        ServiceCall,
        ServiceResponse,
        SupportsResponse,
    )
    from homeassistant.exceptions import HomeAssistantError, ServiceValidationError
    from homeassistant.helpers import config_validation as cv
    import voluptuous as vol
except ImportError:
    from enum import StrEnum

    class SupportsResponse(StrEnum):  # type: ignore[no-redef]
        """Stub SupportsResponse."""

        NONE = "none"
        ONLY = "only"
        OPTIONAL = "optional"

    class HomeAssistantError(Exception):  # type: ignore[no-redef]
        """Stub HomeAssistantError."""

    class ServiceValidationError(HomeAssistantError):  # type: ignore[no-redef]
        """Stub ServiceValidationError."""

    class ServiceCall:  # type: ignore[no-redef]
        """Stub ServiceCall."""

        def __init__(
            self,
            domain: str,
            service: str,
            data: dict[str, Any],
            context: Any = None,
        ) -> None:
            self.domain = domain
            self.service = service
            self.data = data
            self.context = context

    ServiceResponse = dict[str, Any]  # type: ignore[misc,assignment]

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
                self.schema = schema

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


SUGGEST_PAIRING_SCHEMA = vol.Schema(
    {
        vol.Optional("dish"): cv.string,
        vol.Optional("food_ids"): vol.All(cv.ensure_list, [cv.positive_int]),
        vol.Optional("entry_id"): cv.string,
    }
)

DRINK_BOTTLE_SCHEMA = vol.Schema(
    {
        vol.Required("bottle_id"): cv.positive_int,
        vol.Optional("vintage_id"): cv.positive_int,
        vol.Optional("entry_id"): cv.string,
    }
)


def _rating_validator(value: Any) -> float:
    try:
        return parse_rating(value)
    except ValueError as err:
        raise vol.Invalid(str(err)) from err


RATE_WINE_SCHEMA = vol.Schema(
    {
        vol.Required("vintage_id"): cv.positive_int,
        vol.Required("rating"): _rating_validator,
        vol.Optional("note"): cv.string,
        vol.Optional("entry_id"): cv.string,
    }
)

REFRESH_SCHEMA = vol.Schema(
    {
        vol.Optional("entry_id"): cv.string,
    }
)


def _get_coordinator(hass: Any, call: ServiceCall) -> VivinoCellarCoordinator:
    """Get targeted coordinator from service call."""
    domain_data = hass.data.get(DOMAIN, {})
    coordinators: dict[str, VivinoCellarCoordinator] = {
        k: v
        for k, v in domain_data.items()
        if isinstance(v, VivinoCellarCoordinator) or hasattr(v, "async_suggest_pairing")
    }

    if not coordinators:
        raise HomeAssistantError("Vivino Cellar is not configured.")

    entry_id = call.data.get("entry_id")
    if entry_id:
        if entry_id not in coordinators:
            raise HomeAssistantError(f"Vivino Cellar entry '{entry_id}' not found.")
        return coordinators[entry_id]

    return next(iter(coordinators.values()))


async def async_setup_services(hass: Any) -> None:
    """Register Vivino Cellar services."""
    if not hasattr(hass, "services"):
        return

    if hass.services.has_service(DOMAIN, SERVICE_SUGGEST_PAIRING):
        return

    async def handle_suggest_pairing(call: ServiceCall) -> ServiceResponse:
        """Handle vivino_cellar.suggest_pairing action."""
        dish = call.data.get("dish")
        food_ids = call.data.get("food_ids")

        has_dish = bool(dish and str(dish).strip())
        has_food_ids = bool(food_ids)

        if (has_dish and has_food_ids) or (not has_dish and not has_food_ids):
            raise ServiceValidationError(
                "Exactly one of 'dish' or 'food_ids' must be provided."
            )

        clean_dish = str(dish).strip() if has_dish else None
        clean_food_ids = [int(f) for f in food_ids] if has_food_ids else None

        coordinator = _get_coordinator(hass, call)
        results = await coordinator.async_suggest_pairing(
            dish=clean_dish,
            food_ids=clean_food_ids,
        )

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
                    "match_score": result.match_score,
                    "window_status": result.window_status,
                    "explanation": result.explanation,
                    "bottles": [
                        {
                            "bottle_id": b.id,
                            "id": b.id,
                            "storage_location_id": b.storage_location_id,
                            "location_name": b.location_name,
                            "location_number": b.location_number,
                            "bin": b.bin,
                        }
                        for b in vintage.bottles
                    ],
                }
            )

        return {"matches": matches}

    async def handle_drink_bottle(call: ServiceCall) -> None:
        """Handle vivino_cellar.drink_bottle action."""
        bottle_id = call.data.get("bottle_id")
        if bottle_id is None:
            raise ServiceValidationError("bottle_id is required.")
        try:
            bottle_id = int(bottle_id)
        except (TypeError, ValueError) as err:
            raise ServiceValidationError(f"Invalid bottle_id: {bottle_id}") from err

        vintage_id = call.data.get("vintage_id")
        if vintage_id is not None:
            try:
                vintage_id = int(vintage_id)
            except (TypeError, ValueError) as err:
                raise ServiceValidationError(
                    f"Invalid vintage_id: {vintage_id}"
                ) from err

        coordinator = _get_coordinator(hass, call)
        await coordinator.async_drink_bottle(
            bottle_id=bottle_id,
            vintage_id=vintage_id,
        )

    async def handle_rate_wine(call: ServiceCall) -> ServiceResponse:
        """Handle vivino_cellar.rate_wine action."""
        try:
            vintage_id = int(call.data["vintage_id"])
            rating = parse_rating(call.data.get("rating"))
        except (KeyError, TypeError, ValueError) as err:
            raise ServiceValidationError(f"Invalid rating request: {err}") from err
        note = call.data.get("note")

        coordinator = _get_coordinator(hass, call)
        review = await coordinator.async_rate_wine(vintage_id, rating, note)
        return {"rating": review.get("rating"), "note": review.get("note")}

    async def handle_refresh(call: ServiceCall) -> None:
        """Handle vivino_cellar.refresh action."""
        domain_data = hass.data.get(DOMAIN, {})
        entry_id = call.data.get("entry_id")

        if entry_id:
            if entry_id not in domain_data:
                raise HomeAssistantError(f"Vivino Cellar entry '{entry_id}' not found.")
            await domain_data[entry_id].async_refresh()
            return

        coordinators = [
            v
            for v in domain_data.values()
            if isinstance(v, VivinoCellarCoordinator) or hasattr(v, "async_refresh")
        ]
        if not coordinators:
            raise HomeAssistantError("Vivino Cellar is not configured.")

        for coord in coordinators:
            await coord.async_refresh()

    hass.services.async_register(
        DOMAIN,
        SERVICE_SUGGEST_PAIRING,
        handle_suggest_pairing,
        schema=SUGGEST_PAIRING_SCHEMA,
        supports_response=SupportsResponse.ONLY,
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_DRINK_BOTTLE,
        handle_drink_bottle,
        schema=DRINK_BOTTLE_SCHEMA,
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_RATE_WINE,
        handle_rate_wine,
        schema=RATE_WINE_SCHEMA,
        supports_response=SupportsResponse.OPTIONAL,
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_REFRESH,
        handle_refresh,
        schema=REFRESH_SCHEMA,
    )


async def async_unload_services(hass: Any) -> None:
    """Unregister Vivino Cellar services."""
    if not hasattr(hass, "services"):
        return

    for service in (
        SERVICE_SUGGEST_PAIRING,
        SERVICE_DRINK_BOTTLE,
        SERVICE_RATE_WINE,
        SERVICE_REFRESH,
    ):
        if hass.services.has_service(DOMAIN, service):
            hass.services.async_remove(DOMAIN, service)
