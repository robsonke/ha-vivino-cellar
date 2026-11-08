"""Assist voice intent support for the Vivino Cellar integration."""

from __future__ import annotations

import logging
from typing import Any

from .const import DOMAIN, INTENT_SUGGEST_WINE
from .coordinator import VivinoCellarCoordinator
from .exceptions import VivinoError

_LOGGER = logging.getLogger(__name__)

try:
    from homeassistant.core import HomeAssistant
    from homeassistant.helpers import intent

    Intent = intent.Intent
    IntentResponse = intent.IntentResponse
    IntentHandler = intent.IntentHandler
except ImportError:

    class IntentResponse:  # type: ignore[no-redef]
        """Stub IntentResponse."""

        def __init__(self, language: str = "en") -> None:
            self.language = language
            self.speech: dict[str, dict[str, Any]] = {}
            self.card: dict[str, dict[str, Any]] = {}

        def async_set_speech(
            self, speech: str, speech_type: str = "plain", extra_data: Any = None
        ) -> None:
            self.speech[speech_type] = {"speech": speech, "extra_data": extra_data}

    class Intent:  # type: ignore[no-redef]
        """Stub Intent."""

        def __init__(
            self,
            hass: Any,
            platform: str,
            intent_type: str,
            slots: dict[str, Any],
            language: str = "en",
        ) -> None:
            self.hass = hass
            self.platform = platform
            self.intent_type = intent_type
            self.slots = slots
            self.language = language

        def create_response(self) -> IntentResponse:
            return IntentResponse(language=self.language)

    class IntentHandler:  # type: ignore[no-redef]
        """Stub IntentHandler."""

        intent_type: str = ""
        slot_schema: Any = None

        def async_validate_slots(self, slots: dict[str, Any]) -> dict[str, Any]:
            result = {}
            for k, v in slots.items():
                if isinstance(v, dict) and "value" in v:
                    result[k] = v["value"]
                else:
                    result[k] = v
            return result

        async def async_handle(self, intent_obj: Any) -> Any:
            raise NotImplementedError

    class intent:  # type: ignore[no-redef]
        """Stub intent helper module."""

        IntentHandler = IntentHandler
        IntentResponse = IntentResponse
        Intent = Intent

        @staticmethod
        def async_register(hass: Any, handler: Any) -> None:
            hass.data.setdefault("intent", {})
            hass.data["intent"][handler.intent_type] = handler

        @staticmethod
        def async_remove(hass: Any, intent_type: str) -> None:
            if "intent" in hass.data:
                hass.data["intent"].pop(intent_type, None)


class VivinoCellarSuggestWineIntent(intent.IntentHandler):
    """Handle VivinoCellarSuggestWine voice intent for Assist."""

    intent_type = INTENT_SUGGEST_WINE

    def __init__(self, hass: Any | None = None) -> None:
        """Initialize the intent handler."""
        self.hass = hass

    async def async_handle(self, intent_obj: intent.Intent) -> intent.IntentResponse:
        """Handle the intent and return spoken summary."""
        hass = getattr(intent_obj, "hass", None) or self.hass
        response = intent_obj.create_response()
        language = getattr(intent_obj, "language", "en") or "en"
        is_nl = language.lower().startswith("nl")

        if not hass or DOMAIN not in hass.data or not hass.data[DOMAIN]:
            msg = (
                "Vivino kelder is niet geconfigureerd."
                if is_nl
                else "Vivino Cellar is not configured."
            )
            response.async_set_speech(msg)
            return response

        domain_data = hass.data[DOMAIN]
        coordinators = [
            v
            for v in domain_data.values()
            if isinstance(v, VivinoCellarCoordinator)
            or hasattr(v, "async_suggest_pairing")
        ]
        if not coordinators:
            msg = (
                "Vivino kelder is niet geconfigureerd."
                if is_nl
                else "Vivino Cellar is not configured."
            )
            response.async_set_speech(msg)
            return response

        coordinator = coordinators[0]

        slots = self.async_validate_slots(intent_obj.slots)
        dish = slots.get("dish")
        if isinstance(dish, dict):
            dish = dish.get("value")
        food = slots.get("food")
        if isinstance(food, dict):
            food = food.get("value")

        clean_dish = str(dish).strip() if dish else None
        clean_food = str(food).strip() if food else None

        if not clean_dish and not clean_food:
            msg = (
                "Geef een gerecht of voedselcategorie op."
                if is_nl
                else "Please specify a dish or food category to pair with."
            )
            response.async_set_speech(msg)
            return response

        results = []
        try:
            if clean_food:
                matched_id = None
                if coordinator.data and coordinator.data.food_categories:
                    food_lower = clean_food.lower()
                    for cat in coordinator.data.food_categories:
                        if (
                            food_lower == cat.name.lower()
                            or food_lower == cat.seo_name.lower()
                            or food_lower in cat.name.lower()
                            or cat.name.lower() in food_lower
                        ):
                            matched_id = cat.id
                            break

                if matched_id is not None:
                    results = await coordinator.async_suggest_pairing(
                        dish=None,
                        food_ids=[matched_id],
                    )
                else:
                    results = await coordinator.async_suggest_pairing(
                        dish=clean_food,
                        food_ids=None,
                    )
            elif clean_dish:
                results = await coordinator.async_suggest_pairing(
                    dish=clean_dish,
                    food_ids=None,
                )
        except VivinoError as err:
            _LOGGER.warning("Voice pairing failed: %s", err)
            msg = (
                f"Kon geen wijnadvies geven: {err}"
                if is_nl
                else f"Sorry, I could not suggest a wine pairing: {err}"
            )
            response.async_set_speech(msg)
            return response
        except Exception as err:  # noqa: BLE001
            _LOGGER.error("Unexpected error in voice pairing: %s", err)
            msg = (
                "Er is een onverwachte fout opgetreden bij het zoeken naar wijn."
                if is_nl
                else "An unexpected error occurred while searching for wine pairings."
            )
            response.async_set_speech(msg)
            return response

        if not results:
            msg = (
                "Ik kon geen geschikte wijn vinden in je kelder."
                if is_nl
                else "I couldn't find any suitable wine pairings in your cellar."
            )
            response.async_set_speech(msg)
            return response

        top = results[0]
        vintage = top.vintage
        vintage_name = (
            f"{vintage.year} {vintage.name}".strip()
            if vintage.year
            else vintage.name
        )

        bottle_info = ""
        if vintage.bottles:
            num = len(vintage.bottles)
            first_b = vintage.bottles[0]
            loc_parts = []
            if first_b.location_name:
                loc_parts.append(f"in {first_b.location_name}")
            if first_b.bin:
                if is_nl:
                    loc_parts.append(f"vak {first_b.bin}")
                else:
                    loc_parts.append(f"bin {first_b.bin}")
            loc_str = " ".join(loc_parts)

            if is_nl:
                pl = "flessen" if num > 1 else "fles"
                bottle_info = (
                    f"Je hebt {num} {pl} {loc_str}."
                    if loc_str
                    else f"Je hebt {num} {pl} in je kelder."
                )
            else:
                pl = "bottles" if num > 1 else "bottle"
                bottle_info = (
                    f"You have {num} {pl} {loc_str}."
                    if loc_str
                    else f"You have {num} {pl} in your cellar."
                )

        if is_nl:
            speech = f"Ik raad de {vintage_name} aan. {top.explanation}. {bottle_info}".strip()
        else:
            speech = f"I recommend the {vintage_name}. {top.explanation}. {bottle_info}".strip()

        response.async_set_speech(speech)
        return response


async def async_setup_intents(hass: Any) -> None:
    """Register Vivino Cellar Assist intents."""
    intent.async_register(hass, VivinoCellarSuggestWineIntent(hass))


async def async_unload_intents(hass: Any) -> None:
    """Unregister Vivino Cellar Assist intents."""
    if hasattr(intent, "async_remove"):
        intent.async_remove(hass, INTENT_SUGGEST_WINE)
    elif "intent" in hass.data:
        hass.data["intent"].pop(INTENT_SUGGEST_WINE, None)
