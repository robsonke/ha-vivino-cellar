"""DataUpdateCoordinator for Vivino Cellar with AI window estimation and pairing dispatcher."""

from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime, timedelta
import json
import logging
from typing import Any

from .exceptions import VivinoAuthError, VivinoError
from .models import CellarData, Vintage
from .pairing import PairingResult, score_vintages
from .vivino_client import VivinoClient

_LOGGER = logging.getLogger(__name__)

STORAGE_VERSION = 1
STORAGE_KEY_PREFIX = "vivino_cellar_ai_windows"

try:
    from homeassistant.core import HomeAssistant
    from homeassistant.exceptions import ConfigEntryAuthFailed
    from homeassistant.helpers.storage import Store
    from homeassistant.helpers.update_coordinator import (
        DataUpdateCoordinator,
        UpdateFailed,
    )
except ImportError:
    # Graceful fallback stubs when running in test environment without Home Assistant
    class HomeAssistant:  # type: ignore[no-redef]
        """Stub Home Assistant core."""

    class ConfigEntryAuthFailed(Exception):  # type: ignore[no-redef]
        """Stub exception indicating authentication failure."""

    class UpdateFailed(Exception):  # type: ignore[no-redef]
        """Stub exception indicating update failure."""

    class Store:  # type: ignore[no-redef]
        """Stub Store for Home Assistant persistent storage helper."""

        def __init__(self, hass: Any, version: int, key: str) -> None:
            self.hass = hass
            self.version = version
            self.key = key
            self._data: dict[str, Any] | None = None

        async def async_load(self) -> dict[str, Any] | None:
            return self._data

        async def async_save(self, data: dict[str, Any]) -> None:
            self._data = data

    class DataUpdateCoordinator[T]:  # type: ignore[no-redef]
        """Stub DataUpdateCoordinator for Home Assistant."""

        def __init__(
            self,
            hass: Any,
            logger: logging.Logger,
            *,
            name: str,
            update_interval: timedelta | None = None,
            update_method: Callable[[], Awaitable[T]] | None = None,
        ) -> None:
            self.hass = hass
            self.logger = logger
            self.name = name
            self.update_interval = update_interval
            self.update_method = update_method
            self.data: T | None = None
            self.last_update_success_time: datetime | None = None
            self._listeners: list[Callable[[], None]] = []

        async def async_refresh(self) -> None:
            """Refresh coordinator data."""
            if self.update_method:
                self.data = await self.update_method()
            else:
                self.data = await self._async_update_data()
            self.last_update_success_time = datetime.now(UTC)
            self.async_update_listeners()

        async def async_config_entry_first_refresh(self) -> None:
            """Refresh data for first config entry setup."""
            await self.async_refresh()

        async def _async_update_data(self) -> T:
            raise NotImplementedError

        def async_add_listener(
            self, update_callback: Callable[[], None]
        ) -> Callable[[], None]:
            self._listeners.append(update_callback)
            return lambda: self._listeners.remove(update_callback)

        def async_update_listeners(self) -> None:
            for listener in list(self._listeners):
                listener()


def _clean_json_str(val: str) -> Any:
    """Strip markdown code fences and parse JSON."""
    s = val.strip()
    if s.startswith("```"):
        lines = s.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        s = "\n".join(lines).strip()
    try:
        return json.loads(s)
    except (ValueError, TypeError):
        return None


def _parse_pairing_weights(response: Any) -> dict[int, float]:
    """Extract food_id -> weight mapping from AI pairing response."""
    if not response:
        return {}

    if isinstance(response, str):
        parsed = _clean_json_str(response)
        if parsed is not None:
            response = parsed
        else:
            return {}

    if isinstance(response, dict):
        for key in (
            "data",
            "result",
            "response",
            "matches",
            "categories",
            "food_categories",
        ):
            if key in response:
                inner = response[key]
                if isinstance(inner, str):
                    parsed = _clean_json_str(inner)
                    if parsed is not None:
                        response = parsed
                        break
                elif isinstance(inner, (list, dict)):
                    response = inner
                    break

    weights: dict[int, float] = {}

    if isinstance(response, list):
        for item in response:
            if isinstance(item, dict):
                fid = item.get("food_id") or item.get("id") or item.get("category_id")
                weight = item.get("weight", 1.0)
                if fid is not None:
                    try:
                        weights[int(fid)] = float(weight)
                    except (ValueError, TypeError):
                        pass
    elif isinstance(response, dict):
        for k, v in response.items():
            try:
                if k in ("food_id", "id") and isinstance(v, (int, str)):
                    weights[int(v)] = float(response.get("weight", 1.0))
                    break
                fid = int(k)
                weights[fid] = float(v)
            except (ValueError, TypeError):
                continue

    return weights


def _parse_window_response(response: Any) -> tuple[int, int, float | None] | None:
    """Extract (start_year, end_year, confidence) from AI drinking window response."""
    if not response:
        return None

    if isinstance(response, str):
        parsed = _clean_json_str(response)
        if parsed is not None:
            response = parsed
        else:
            return None

    if isinstance(response, dict):
        for key in ("data", "result", "response"):
            if key in response:
                inner = response[key]
                if isinstance(inner, str):
                    parsed = _clean_json_str(inner)
                    if parsed is not None:
                        response = parsed
                        break
                elif isinstance(inner, dict):
                    response = inner
                    break

    if not isinstance(response, dict):
        return None

    start_year = response.get("start_year")
    end_year = response.get("end_year")
    confidence = response.get("confidence")

    try:
        start_year_int = int(start_year)
        end_year_int = int(end_year)
    except (ValueError, TypeError):
        return None

    conf_val: float | None = None
    if confidence is not None:
        try:
            conf_val = float(confidence)
        except (ValueError, TypeError):
            pass

    return start_year_int, end_year_int, conf_val


class VivinoCellarCoordinator(DataUpdateCoordinator[CellarData]):
    """Coordinator to manage polling Vivino cellar and AI estimations."""

    def __init__(
        self,
        hass: HomeAssistant,
        client: VivinoClient,
        ai_task_entity: str | None = None,
        update_interval: timedelta = timedelta(hours=6),
    ) -> None:
        """Initialize the Vivino Cellar coordinator."""
        super().__init__(
            hass,
            _LOGGER,
            name="Vivino Cellar",
            update_interval=update_interval,
        )
        self.client = client
        self.ai_task_entity = ai_task_entity
        self.settings: dict[str, Any] = {}
        self.last_refresh_time: datetime | None = None

        cellar_key = getattr(client, "cellar_id", "default")
        store_key = f"{STORAGE_KEY_PREFIX}_{cellar_key}"
        self._store = Store(hass, STORAGE_VERSION, store_key)
        self._ai_estimates: dict[str, Any] = {}
        self._ai_estimates_loaded = False
        self._ai_estimation_task: asyncio.Task[None] | None = None

    async def _async_update_data(self) -> CellarData:
        """Fetch cellar data, merge stored AI estimates, and trigger AI estimation."""
        if not self._ai_estimates_loaded:
            loaded_data = await self._store.async_load()
            if loaded_data and isinstance(loaded_data, dict):
                self._ai_estimates = dict(loaded_data)
            self._ai_estimates_loaded = True

        try:
            cellar_data = await self.client.async_fetch_cellar()
        except VivinoAuthError as err:
            raise ConfigEntryAuthFailed(
                f"Vivino authentication failed or session expired: {err}"
            ) from err
        except Exception as err:
            raise UpdateFailed(
                f"Error fetching cellar data from Vivino: {err}"
            ) from err

        vintages_needing_estimate: list[Vintage] = []

        for vintage in cellar_data.vintages:
            if vintage.start_year is None:
                stored = self._ai_estimates.get(
                    str(vintage.id)
                ) or self._ai_estimates.get(vintage.id)
                if stored and isinstance(stored, dict) and "start_year" in stored:
                    vintage.start_year = stored.get("start_year")
                    vintage.end_year = stored.get("end_year")
                    vintage.window_source = "ai_estimate"
                else:
                    vintage.window_source = "none"
                    vintages_needing_estimate.append(vintage)
            else:
                vintage.window_source = "vivino"

        self.last_refresh_time = datetime.now(UTC)

        if self.ai_task_entity and vintages_needing_estimate:
            self._schedule_ai_estimation(vintages_needing_estimate)

        return cellar_data

    def _schedule_ai_estimation(self, vintages: list[Vintage]) -> None:
        """Schedule background rate-limited AI window estimation task."""
        if self._ai_estimation_task and not self._ai_estimation_task.done():
            return

        create_task = getattr(self.hass, "async_create_task", asyncio.create_task)
        self._ai_estimation_task = create_task(self._async_estimate_windows(vintages))

    async def async_wait_ai_estimation(self) -> None:
        """Wait for the running background AI estimation task to complete."""
        if self._ai_estimation_task and not self._ai_estimation_task.done():
            await self._ai_estimation_task

    async def _async_estimate_windows(self, vintages: list[Vintage]) -> None:
        """Estimate drinking windows for unknown vintages in the background."""
        if not self.ai_task_entity:
            return

        updated_any = False
        for vintage in vintages:
            if vintage.start_year is not None:
                continue

            try:
                wine_info = {
                    "name": vintage.name,
                    "winery": vintage.winery,
                    "vintage_year": vintage.year,
                    "region": vintage.region,
                    "country": vintage.country,
                    "type_id": vintage.type_id,
                    "grapes": vintage.grapes,
                    "style": vintage.style.name if vintage.style else None,
                }
                prompt = (
                    f"Estimate the drinking window (start year and end year) for this wine:\n"
                    f"{json.dumps(wine_info, ensure_ascii=False)}\n\n"
                    "Return ONLY a JSON object with start_year (integer), end_year (integer), and confidence (float 0.0-1.0), for example: "
                    '{"start_year": 2024, "end_year": 2030, "confidence": 0.9}'
                )
                service_data = {
                    "entity_id": self.ai_task_entity,
                    "task_name": "estimate_drinking_window",
                    "instructions": prompt,
                }

                response = await self.hass.services.async_call(
                    "ai_task",
                    "generate_data",
                    service_data,
                    blocking=True,
                    return_response=True,
                )
                parsed = _parse_window_response(response)
                if parsed:
                    start_yr, end_yr, conf = parsed
                    self._ai_estimates[str(vintage.id)] = {
                        "start_year": start_yr,
                        "end_year": end_yr,
                        "confidence": conf,
                    }
                    vintage.start_year = start_yr
                    vintage.end_year = end_yr
                    vintage.window_source = "ai_estimate"
                    updated_any = True
            except Exception as err:  # noqa: BLE001
                _LOGGER.warning(
                    "Failed to estimate drinking window for vintage %s (%s): %s",
                    vintage.id,
                    vintage.name,
                    err,
                )

            await asyncio.sleep(0.01)

        if updated_any:
            try:
                await self._store.async_save(self._ai_estimates)
            except Exception as err:  # noqa: BLE001
                _LOGGER.error("Failed to save AI window estimates to store: %s", err)
            self.async_update_listeners()

    async def async_suggest_pairing(
        self,
        dish: str | None = None,
        food_ids: list[int] | None = None,
    ) -> list[PairingResult]:
        """Suggest wine pairings based on food category IDs or free-text dish."""
        if not self.data or not self.data.vintages:
            return []

        current_year = datetime.now(UTC).year

        if food_ids:
            target_weights = {int(fid): 1.0 for fid in food_ids}
            return score_vintages(self.data.vintages, target_weights, current_year)

        if dish:
            if not self.ai_task_entity:
                raise VivinoError(
                    "AI pairing unavailable; please select food categories."
                )

            foods_context = [
                {"id": cat.id, "name": cat.name, "seo_name": cat.seo_name}
                for cat in self.data.food_categories
            ]
            prompt = (
                f"Match the following dish to the most appropriate food categories from the provided list.\n"
                f"Dish: {dish}\n\n"
                f"Available categories:\n"
                f"{json.dumps(foods_context, ensure_ascii=False)}\n\n"
                "Return ONLY a JSON array containing matching category IDs and weights between 0.0 and 1.0, for example: "
                '[{"food_id": 4, "weight": 1.0, "reason": "matches beef"}]'
            )
            service_data = {
                "entity_id": self.ai_task_entity,
                "task_name": "wine_pairing",
                "instructions": prompt,
            }

            try:
                response = await self.hass.services.async_call(
                    "ai_task",
                    "generate_data",
                    service_data,
                    blocking=True,
                    return_response=True,
                )
            except Exception as err:
                _LOGGER.warning(
                    "AI pairing service call to %s failed: %s", self.ai_task_entity, err
                )
                raise VivinoError(
                    "AI pairing unavailable; please select food categories."
                ) from err

            target_weights = _parse_pairing_weights(response)
            if not target_weights:
                return []

            return score_vintages(self.data.vintages, target_weights, current_year)

        return []

    async def async_get_rating(self, vintage_id: int) -> dict[str, Any] | None:
        """The user's own Vivino rating of a vintage, or None."""
        return await self.client.async_get_rating(vintage_id)

    async def async_rate_wine(
        self, vintage_id: int, rating: float, note: str | None = None
    ) -> dict[str, Any]:
        """Rate a vintage on Vivino (1-5 in half stars); None keeps the note."""
        try:
            return await self.client.async_rate_vintage(vintage_id, rating, note)
        except ValueError as err:
            raise VivinoError(str(err)) from err

    async def async_drink_bottle(
        self,
        bottle_id: int,
        vintage_id: int | None = None,
    ) -> None:
        """Remove a bottle from the cellar and refresh coordinator."""
        success = await self.client.async_remove_bottle(
            bottle_id, vintage_id=vintage_id
        )
        if not success:
            raise VivinoError(f"Failed to remove bottle {bottle_id} from Vivino.")
        await self.async_refresh()
