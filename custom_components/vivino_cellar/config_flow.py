"""Config flow for Vivino Cellar integration."""

from __future__ import annotations

from collections.abc import Mapping
import logging
from typing import Any

from .const import (
    CONF_AI_TASK,
    CONF_CELLAR_URL,
    CONF_COOKIE,
    CONF_LOCATION_NAMES,
    CONF_NOW_LIMIT,
    CONF_SCAN_INTERVAL,
    CONF_SHOW_PANEL,
    CONF_WEATHER_ENTITY,
    DOMAIN,
    cellar_settings,
)
from .exceptions import (
    VivinoAuthError,
    VivinoConnectionError,
)
from .i18n import async_texts, plural
from .locations import location_counts
from .vivino_client import VivinoClient

_LOGGER = logging.getLogger(__name__)

try:
    from homeassistant import config_entries
    from homeassistant.core import callback
    from homeassistant.data_entry_flow import AbortFlow, FlowResult
    from homeassistant.helpers.aiohttp_client import async_get_clientsession
    from homeassistant.helpers.selector import (
        BooleanSelector,
        EntitySelector,
        EntitySelectorConfig,
        NumberSelector,
        NumberSelectorConfig,
        NumberSelectorMode,
    )
    import voluptuous as vol
except ImportError:
    # Graceful fallback stubs when running in test environment without Home Assistant
    class AbortFlow(Exception):  # type: ignore[no-redef]
        """Stub AbortFlow exception."""

        def __init__(
            self, reason: str, description_placeholders: dict[str, str] | None = None
        ) -> None:
            super().__init__(reason)
            self.reason = reason
            self.description_placeholders = description_placeholders

    FlowResult = dict[str, Any]  # type: ignore[misc,assignment]

    def callback(func: Any) -> Any:  # type: ignore[no-redef]
        """Stub callback decorator."""
        return func

    class NumberSelectorMode:  # type: ignore[no-redef]
        """Stub NumberSelectorMode."""

        BOX = "box"
        SLIDER = "slider"

    class NumberSelectorConfig:  # type: ignore[no-redef]
        """Stub NumberSelectorConfig."""

        def __init__(self, **kwargs: Any) -> None:
            self.kwargs = kwargs

    class NumberSelector:  # type: ignore[no-redef]
        """Stub NumberSelector."""

        def __init__(self, config: Any = None) -> None:
            self.config = config

    class BooleanSelector:  # type: ignore[no-redef]
        """Stub BooleanSelector."""

        def __init__(self, config: Any = None) -> None:
            self.config = config

    def async_get_clientsession(hass: Any) -> Any:  # type: ignore[no-redef]
        """Stub get clientsession."""
        if hasattr(hass, "client_session"):
            return hass.client_session
        if hasattr(hass, "helpers") and hasattr(hass.helpers, "aiohttp_client"):
            return hass.helpers.aiohttp_client.async_get_clientsession(hass)
        import aiohttp

        return aiohttp.ClientSession()

    class EntitySelectorConfig:  # type: ignore[no-redef]
        """Stub EntitySelectorConfig."""

        def __init__(self, domain: str | None = None, **kwargs: Any) -> None:
            self.domain = domain
            self.kwargs = kwargs

    class EntitySelector:  # type: ignore[no-redef]
        """Stub EntitySelector."""

        def __init__(self, config: EntitySelectorConfig | None = None) -> None:
            self.config = config

    class _Marker:
        def __init__(self, schema: Any, description: Any = None) -> None:
            self.schema = schema
            self.description = description

        def __hash__(self) -> int:
            return hash(self.schema)

        def __eq__(self, other: Any) -> bool:
            if isinstance(other, _Marker):
                return self.schema == other.schema
            return self.schema == other

        def __repr__(self) -> str:
            return f"Marker({self.schema})"

    class vol:  # type: ignore[no-redef]
        """Stub voluptuous module."""

        class Schema:
            def __init__(self, schema: Any) -> None:
                self.schema = schema

            def __call__(self, data: Any) -> Any:
                return data

        @staticmethod
        def Required(key: str, default: Any = None) -> _Marker:
            return _Marker(key, default)

        @staticmethod
        def Optional(key: str, default: Any = None) -> _Marker:
            return _Marker(key, default)

    class config_entries:  # type: ignore[no-redef]
        """Stub config_entries module."""

        class OptionsFlow:
            """Stub OptionsFlow."""

            config_entry: Any = None

            def add_suggested_values_to_schema(
                self, data_schema: Any, suggested_values: Mapping[str, Any] | None
            ) -> Any:
                return data_schema

            def async_show_form(
                self, *, step_id: str, data_schema: Any = None, **kwargs: Any
            ) -> FlowResult:
                return {"type": "form", "step_id": step_id, "data_schema": data_schema}

            def async_create_entry(
                self, *, data: dict[str, Any], title: str = ""
            ) -> FlowResult:
                return {"type": "create_entry", "title": title, "data": data}

        class ConfigFlow:
            """Stub ConfigFlow."""

            DOMAIN: str = ""

            def __init_subclass__(
                cls, domain: str | None = None, **kwargs: Any
            ) -> None:
                super().__init_subclass__(**kwargs)
                if domain:
                    cls.DOMAIN = domain

            def __init__(self) -> None:
                self.hass: Any = None
                self.unique_id: str | None = None
                self._reauth_entry: Any = None
                self.context: dict[str, Any] = {}

            async def async_set_unique_id(
                self, unique_id: str, *, raise_on_progress: bool = True
            ) -> None:
                self.unique_id = unique_id

            def _abort_if_unique_id_configured(
                self,
                updates: dict[str, Any] | None = None,
                reload_on_update: bool = True,
            ) -> None:
                for entry in self._async_current_entries():
                    if entry.unique_id == self.unique_id:
                        raise AbortFlow("already_configured")

            def _async_current_entries(self) -> list[Any]:
                if (
                    self.hass
                    and hasattr(self.hass, "config_entries")
                    and hasattr(self.hass.config_entries, "async_entries")
                ):
                    return self.hass.config_entries.async_entries(self.DOMAIN)
                return []

            def _get_reauth_entry(self) -> Any:
                return getattr(self, "_reauth_entry", None)

            def add_suggested_values_to_schema(
                self, data_schema: Any, suggested_values: Mapping[str, Any] | None
            ) -> Any:
                return data_schema

            def async_show_form(
                self,
                *,
                step_id: str,
                data_schema: Any = None,
                errors: dict[str, str] | None = None,
                description_placeholders: dict[str, str] | None = None,
            ) -> FlowResult:
                return {
                    "type": "form",
                    "step_id": step_id,
                    "data_schema": data_schema,
                    "errors": errors or {},
                    "description_placeholders": description_placeholders,
                }

            def async_create_entry(
                self,
                *,
                title: str,
                data: dict[str, Any],
                description: str | None = None,
                description_placeholders: dict[str, str] | None = None,
            ) -> FlowResult:
                return {
                    "type": "create_entry",
                    "title": title,
                    "data": data,
                    "description": description,
                    "description_placeholders": description_placeholders,
                }

            def async_abort(
                self,
                *,
                reason: str,
                description_placeholders: dict[str, str] | None = None,
            ) -> FlowResult:
                return {
                    "type": "abort",
                    "reason": reason,
                    "description_placeholders": description_placeholders,
                }

            def async_update_reload_and_abort(
                self,
                entry: Any,
                *,
                data: dict[str, Any] | None = None,
                reason: str = "reauth_successful",
                reload_even_if_entry_is_unchanged: bool = True,
            ) -> FlowResult:
                if entry is not None and data is not None and hasattr(entry, "data"):
                    if isinstance(entry.data, dict):
                        entry.data.update(data)
                return self.async_abort(reason=reason)


STEP_USER_DATA_SCHEMA = vol.Schema(
    {
        vol.Required(CONF_CELLAR_URL): str,
        vol.Required(CONF_COOKIE): str,
        vol.Optional(CONF_AI_TASK): EntitySelector(
            EntitySelectorConfig(domain="ai_task")
        ),
    }
)


async def _async_validate_vivino(
    session: Any,
    cellar_url: str,
    cookie: str,
) -> VivinoClient:
    """Validate cellar URL and session cookie by fetching version and page."""
    client = VivinoClient(
        session=session,
        cellar_url=cellar_url,
        cookie=cookie,
    )
    if not client.version:
        await client._refresh_version(client._base_url)
    await client._fetch_deferred_page(1)
    return client


OPTIONS_SCHEMA = vol.Schema(
    {
        vol.Optional(CONF_AI_TASK): EntitySelector(
            EntitySelectorConfig(domain="ai_task")
        ),
        vol.Optional(CONF_WEATHER_ENTITY): EntitySelector(
            EntitySelectorConfig(domain="weather")
        ),
        vol.Required(CONF_SCAN_INTERVAL): NumberSelector(
            NumberSelectorConfig(
                min=1,
                max=24,
                step=1,
                unit_of_measurement="h",
                mode=NumberSelectorMode.BOX,
            )
        ),
        vol.Required(CONF_SHOW_PANEL): BooleanSelector(),
        vol.Required(CONF_NOW_LIMIT): NumberSelector(
            NumberSelectorConfig(min=1, max=20, step=1, mode=NumberSelectorMode.BOX)
        ),
    }
)


class VivinoCellarOptionsFlow(config_entries.OptionsFlow):
    """Configure screen: AI task, refresh interval, panel and list size.

    The cellar name is the entry title, changed with Home Assistant's Rename.
    """

    _options: dict[str, Any]

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Show and save the options; then name storage locations, if any."""
        if user_input is not None:
            self._options = {
                # Stored even when cleared, so it overrides the setup value.
                CONF_AI_TASK: user_input.get(CONF_AI_TASK) or None,
                CONF_SCAN_INTERVAL: int(user_input[CONF_SCAN_INTERVAL]),
                CONF_SHOW_PANEL: bool(user_input[CONF_SHOW_PANEL]),
                CONF_NOW_LIMIT: int(user_input[CONF_NOW_LIMIT]),
                CONF_WEATHER_ENTITY: user_input.get(CONF_WEATHER_ENTITY) or None,
            }
            if await self._async_location_fields():
                return await self.async_step_locations()
            existing = (self.config_entry.options or {}).get(CONF_LOCATION_NAMES)
            if existing:
                self._options[CONF_LOCATION_NAMES] = dict(existing)
            return self.async_create_entry(data=self._options)

        settings = cellar_settings(self.config_entry)
        suggested = {
            k: v for k, v in settings.items() if k != "title" and v is not None
        }
        return self.async_show_form(
            step_id="init",
            data_schema=self.add_suggested_values_to_schema(OPTIONS_SCHEMA, suggested),
        )

    async def _async_location_fields(self) -> dict[str, int]:
        """Form label -> storage location id, for the locations in the cellar.

        Vivino only gives ids, so the label itself names the location and its
        bottle count. Dynamic fields get no translation from HA, so the label
        comes from our own "common" translations in HA's language.
        """
        hass = getattr(self, "hass", None)
        domain_data = getattr(hass, "data", {}).get(DOMAIN, {}) if hass else {}
        coordinator = domain_data.get(self.config_entry.entry_id)
        counts = location_counts(getattr(coordinator, "data", None))
        if not counts:
            return {}
        texts = await async_texts(hass)
        return {
            plural(texts, "location_field", n, id=loc_id): loc_id
            for loc_id, n in counts.items()
        }

    async def async_step_locations(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Name each storage location (e.g. Cellar, Fridge)."""
        fields = await self._async_location_fields()
        if user_input is not None:
            names = {
                str(loc_id): str(user_input.get(label) or "").strip()
                for label, loc_id in fields.items()
            }
            return self.async_create_entry(
                data={
                    **self._options,
                    CONF_LOCATION_NAMES: {k: v for k, v in names.items() if v},
                }
            )

        current = cellar_settings(self.config_entry)[CONF_LOCATION_NAMES]
        schema = vol.Schema({vol.Optional(label): str for label in fields})
        suggested = {
            label: current[str(loc_id)]
            for label, loc_id in fields.items()
            if current.get(str(loc_id))
        }
        return self.async_show_form(
            step_id="locations",
            data_schema=self.add_suggested_values_to_schema(schema, suggested),
        )


class VivinoCellarConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Vivino Cellar."""

    VERSION = 1

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: Any) -> VivinoCellarOptionsFlow:
        """Return the options flow (the integration's Configure button)."""
        return VivinoCellarOptionsFlow()

    def __init__(self) -> None:
        """Initialize the Vivino Cellar config flow."""
        super().__init__()
        self._reauth_data: dict[str, Any] = {}

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Handle the initial step where user provides cellar URL and cookie."""
        errors: dict[str, str] = {}

        if user_input is not None:
            cellar_url = str(user_input.get(CONF_CELLAR_URL, "")).strip()
            cookie = str(user_input.get(CONF_COOKIE, "")).strip()
            session = async_get_clientsession(self.hass)

            try:
                client = await _async_validate_vivino(
                    session=session,
                    cellar_url=cellar_url,
                    cookie=cookie,
                )
            except ValueError:
                errors["base"] = "invalid_url"
            except VivinoAuthError:
                errors["base"] = "invalid_auth"
            except (VivinoConnectionError, TimeoutError):
                errors["base"] = "cannot_connect"
            except Exception as err:
                _LOGGER.exception(
                    "Unexpected exception during Vivino validation: %s", err
                )
                errors["base"] = "cannot_connect"
            else:
                try:
                    await self.async_set_unique_id(client.cellar_id)
                    self._abort_if_unique_id_configured()
                except AbortFlow as err:
                    return self.async_abort(reason=err.reason)

                return self.async_create_entry(
                    title=f"Vivino Cellar ({client.cellar_id})",
                    data={
                        CONF_CELLAR_URL: cellar_url,
                        CONF_COOKIE: cookie,
                        CONF_AI_TASK: user_input.get(CONF_AI_TASK),
                    },
                )

        schema = (
            self.add_suggested_values_to_schema(STEP_USER_DATA_SCHEMA, user_input)
            if user_input
            else STEP_USER_DATA_SCHEMA
        )

        return self.async_show_form(
            step_id="user",
            data_schema=schema,
            errors=errors,
        )

    async def async_step_reauth(
        self, entry_data: Mapping[str, Any] | None = None
    ) -> FlowResult:
        """Handle initiation of re-authentication with Vivino."""
        if entry_data:
            self._reauth_data = dict(entry_data)
        self._reauth_entry = (
            self._get_reauth_entry()
            if hasattr(self, "_get_reauth_entry") and callable(self._get_reauth_entry)
            else None
        )
        return await self.async_step_reauth_confirm()

    async def async_step_reauth_confirm(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Handle user confirmation and cookie input for re-authentication."""
        errors: dict[str, str] = {}
        reauth_entry = (
            self._get_reauth_entry()
            if hasattr(self, "_get_reauth_entry") and callable(self._get_reauth_entry)
            else getattr(self, "_reauth_entry", None)
        )

        cellar_url: str | None = None
        if reauth_entry and hasattr(reauth_entry, "data"):
            cellar_url = reauth_entry.data.get(CONF_CELLAR_URL)
        if not cellar_url and hasattr(self, "_reauth_data"):
            cellar_url = self._reauth_data.get(CONF_CELLAR_URL)

        if not cellar_url:
            return self.async_abort(reason="unknown")

        if user_input is not None:
            cookie = str(user_input.get(CONF_COOKIE, "")).strip()
            session = async_get_clientsession(self.hass)

            try:
                await _async_validate_vivino(
                    session=session,
                    cellar_url=cellar_url,
                    cookie=cookie,
                )
            except VivinoAuthError:
                errors["base"] = "invalid_auth"
            except (VivinoConnectionError, TimeoutError):
                errors["base"] = "cannot_connect"
            except Exception as err:
                _LOGGER.exception("Unexpected exception during reauth: %s", err)
                errors["base"] = "cannot_connect"
            else:
                if reauth_entry:
                    return self.async_update_reload_and_abort(
                        reauth_entry,
                        data={
                            **reauth_entry.data,
                            CONF_COOKIE: cookie,
                        },
                    )
                return self.async_abort(reason="reauth_successful")

        schema = vol.Schema(
            {
                vol.Required(CONF_COOKIE): str,
            }
        )

        return self.async_show_form(
            step_id="reauth_confirm",
            data_schema=schema,
            errors=errors,
        )
