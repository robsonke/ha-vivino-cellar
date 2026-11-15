"""Tests for Vivino Cellar config flow and reauth flow."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from custom_components.vivino_cellar.config_flow import VivinoCellarConfigFlow
from custom_components.vivino_cellar.const import (
    CONF_AI_TASK,
    CONF_CELLAR_URL,
    CONF_COOKIE,
    DOMAIN,
)
from custom_components.vivino_cellar.exceptions import (
    VivinoAuthError,
    VivinoConnectionError,
)

VALID_URL = "https://www.vivino.com/nl/cellars/651553"
INVALID_URL = "https://www.vivino.com/invalid/path"
VALID_COOKIE = "_ruby-web_session=mock_cookie_123"
INVALID_COOKIE = "expired_cookie"


class MockConfigEntry:
    """Mock Home Assistant ConfigEntry."""

    def __init__(
        self,
        entry_id: str,
        domain: str,
        unique_id: str,
        data: dict,
    ) -> None:
        self.entry_id = entry_id
        self.domain = domain
        self.unique_id = unique_id
        self.data = dict(data)


class MockConfigEntries:
    """Mock config entry manager."""

    def __init__(self, entries: list[MockConfigEntry] | None = None) -> None:
        self._entries = entries or []

    def async_entries(self, domain: str) -> list[MockConfigEntry]:
        return [e for e in self._entries if e.domain == domain]


class MockHass:
    """Mock Home Assistant core."""

    def __init__(self, entries: list[MockConfigEntry] | None = None) -> None:
        self.config_entries = MockConfigEntries(entries)
        self.client_session = MagicMock()


@pytest.fixture
def mock_hass() -> MockHass:
    return MockHass()


@pytest.fixture
def flow(mock_hass: MockHass) -> VivinoCellarConfigFlow:
    flow = VivinoCellarConfigFlow()
    flow.hass = mock_hass
    return flow


async def test_user_step_initial_form(flow: VivinoCellarConfigFlow) -> None:
    """Test showing initial user form when user_input is None."""
    result = await flow.async_step_user(user_input=None)

    assert result["type"] == "form"
    assert result["step_id"] == "user"
    assert result["errors"] == {}
    assert result["data_schema"] is not None


async def test_user_step_success(flow: VivinoCellarConfigFlow) -> None:
    """Test successful user step with valid URL and cookie."""
    user_input = {
        CONF_CELLAR_URL: VALID_URL,
        CONF_COOKIE: VALID_COOKIE,
        CONF_AI_TASK: "ai_task.openai",
    }

    with patch(
        "custom_components.vivino_cellar.config_flow.VivinoClient"
    ) as mock_client_cls:
        mock_client = MagicMock()
        mock_client.cellar_id = "651553"
        mock_client.locale = "nl"
        mock_client.version = "mock_version"
        mock_client._base_url = VALID_URL
        mock_client._refresh_version = AsyncMock(return_value="mock_version")
        mock_client._fetch_deferred_page = AsyncMock(return_value={"props": {}})
        mock_client_cls.return_value = mock_client

        result = await flow.async_step_user(user_input=user_input)

    assert result["type"] == "create_entry"
    assert "651553" in result["title"]
    assert result["data"][CONF_CELLAR_URL] == VALID_URL
    assert result["data"][CONF_COOKIE] == VALID_COOKIE
    assert result["data"][CONF_AI_TASK] == "ai_task.openai"
    assert flow.unique_id == "651553"


async def test_user_step_invalid_url(flow: VivinoCellarConfigFlow) -> None:
    """Test user step with invalid cellar URL rejected with invalid_url error."""
    user_input = {
        CONF_CELLAR_URL: INVALID_URL,
        CONF_COOKIE: VALID_COOKIE,
    }

    result = await flow.async_step_user(user_input=user_input)

    assert result["type"] == "form"
    assert result["step_id"] == "user"
    assert result["errors"] == {"base": "invalid_url"}


async def test_user_step_invalid_auth(flow: VivinoCellarConfigFlow) -> None:
    """Test user step with expired cookie returns invalid_auth error."""
    user_input = {
        CONF_CELLAR_URL: VALID_URL,
        CONF_COOKIE: INVALID_COOKIE,
    }

    with patch(
        "custom_components.vivino_cellar.config_flow.VivinoClient"
    ) as mock_client_cls:
        mock_client = MagicMock()
        mock_client.cellar_id = "651553"
        mock_client.locale = "nl"
        mock_client.version = None
        mock_client._base_url = VALID_URL
        mock_client._refresh_version = AsyncMock(
            side_effect=VivinoAuthError("Session expired")
        )
        mock_client_cls.return_value = mock_client

        result = await flow.async_step_user(user_input=user_input)

    assert result["type"] == "form"
    assert result["step_id"] == "user"
    assert result["errors"] == {"base": "invalid_auth"}


async def test_user_step_cannot_connect(flow: VivinoCellarConfigFlow) -> None:
    """Test user step with connection failure returns cannot_connect error."""
    user_input = {
        CONF_CELLAR_URL: VALID_URL,
        CONF_COOKIE: VALID_COOKIE,
    }

    with patch(
        "custom_components.vivino_cellar.config_flow.VivinoClient"
    ) as mock_client_cls:
        mock_client = MagicMock()
        mock_client.cellar_id = "651553"
        mock_client.locale = "nl"
        mock_client.version = None
        mock_client._base_url = VALID_URL
        mock_client._refresh_version = AsyncMock(
            side_effect=VivinoConnectionError("Connection timed out")
        )
        mock_client_cls.return_value = mock_client

        result = await flow.async_step_user(user_input=user_input)

    assert result["type"] == "form"
    assert result["step_id"] == "user"
    assert result["errors"] == {"base": "cannot_connect"}


async def test_user_step_already_configured(mock_hass: MockHass) -> None:
    """Test user step aborts if cellar_id unique ID is already configured."""
    existing_entry = MockConfigEntry(
        entry_id="existing_entry",
        domain=DOMAIN,
        unique_id="651553",
        data={CONF_CELLAR_URL: VALID_URL, CONF_COOKIE: VALID_COOKIE},
    )
    mock_hass.config_entries._entries.append(existing_entry)

    flow = VivinoCellarConfigFlow()
    flow.hass = mock_hass

    user_input = {
        CONF_CELLAR_URL: VALID_URL,
        CONF_COOKIE: VALID_COOKIE,
    }

    with patch(
        "custom_components.vivino_cellar.config_flow.VivinoClient"
    ) as mock_client_cls:
        mock_client = MagicMock()
        mock_client.cellar_id = "651553"
        mock_client.locale = "nl"
        mock_client.version = "1.0"
        mock_client._base_url = VALID_URL
        mock_client._refresh_version = AsyncMock(return_value="1.0")
        mock_client._fetch_deferred_page = AsyncMock(return_value={"props": {}})
        mock_client_cls.return_value = mock_client

        result = await flow.async_step_user(user_input=user_input)

    assert result["type"] == "abort"
    assert result["reason"] == "already_configured"


async def test_reauth_flow_initial_form(flow: VivinoCellarConfigFlow) -> None:
    """Test reauth flow prompts user with reauth_confirm form."""
    reauth_entry = MockConfigEntry(
        entry_id="reauth_entry_id",
        domain=DOMAIN,
        unique_id="651553",
        data={
            CONF_CELLAR_URL: VALID_URL,
            CONF_COOKIE: "old_cookie",
            CONF_AI_TASK: "ai_task.local",
        },
    )
    flow._reauth_entry = reauth_entry

    result = await flow.async_step_reauth(entry_data=reauth_entry.data)

    assert result["type"] == "form"
    assert result["step_id"] == "reauth_confirm"
    assert result["errors"] == {}
    assert result["data_schema"] is not None


async def test_reauth_confirm_invalid_auth(flow: VivinoCellarConfigFlow) -> None:
    """Test reauth_confirm with invalid cookie returns invalid_auth error."""
    reauth_entry = MockConfigEntry(
        entry_id="reauth_entry_id",
        domain=DOMAIN,
        unique_id="651553",
        data={
            CONF_CELLAR_URL: VALID_URL,
            CONF_COOKIE: "old_cookie",
        },
    )
    flow._reauth_entry = reauth_entry

    user_input = {
        CONF_COOKIE: INVALID_COOKIE,
    }

    with patch(
        "custom_components.vivino_cellar.config_flow.VivinoClient"
    ) as mock_client_cls:
        mock_client = MagicMock()
        mock_client.cellar_id = "651553"
        mock_client.version = None
        mock_client._base_url = VALID_URL
        mock_client._refresh_version = AsyncMock(
            side_effect=VivinoAuthError("Session expired")
        )
        mock_client_cls.return_value = mock_client

        result = await flow.async_step_reauth_confirm(user_input=user_input)

    assert result["type"] == "form"
    assert result["step_id"] == "reauth_confirm"
    assert result["errors"] == {"base": "invalid_auth"}


async def test_reauth_confirm_cannot_connect(flow: VivinoCellarConfigFlow) -> None:
    """Test reauth_confirm with connection failure returns cannot_connect error."""
    reauth_entry = MockConfigEntry(
        entry_id="reauth_entry_id",
        domain=DOMAIN,
        unique_id="651553",
        data={
            CONF_CELLAR_URL: VALID_URL,
            CONF_COOKIE: "old_cookie",
        },
    )
    flow._reauth_entry = reauth_entry

    user_input = {
        CONF_COOKIE: VALID_COOKIE,
    }

    with patch(
        "custom_components.vivino_cellar.config_flow.VivinoClient"
    ) as mock_client_cls:
        mock_client = MagicMock()
        mock_client.cellar_id = "651553"
        mock_client.version = None
        mock_client._base_url = VALID_URL
        mock_client._refresh_version = AsyncMock(
            side_effect=VivinoConnectionError("Connection timeout")
        )
        mock_client_cls.return_value = mock_client

        result = await flow.async_step_reauth_confirm(user_input=user_input)

    assert result["type"] == "form"
    assert result["step_id"] == "reauth_confirm"
    assert result["errors"] == {"base": "cannot_connect"}


async def test_reauth_confirm_success(flow: VivinoCellarConfigFlow) -> None:
    """Test successful reauth_confirm updates entry and reloads."""
    reauth_entry = MockConfigEntry(
        entry_id="reauth_entry_id",
        domain=DOMAIN,
        unique_id="651553",
        data={
            CONF_CELLAR_URL: VALID_URL,
            CONF_COOKIE: "old_cookie",
            CONF_AI_TASK: "ai_task.local",
        },
    )
    flow._reauth_entry = reauth_entry

    new_cookie = "_ruby-web_session=fresh_cookie_456"
    user_input = {
        CONF_COOKIE: new_cookie,
    }

    with patch(
        "custom_components.vivino_cellar.config_flow.VivinoClient"
    ) as mock_client_cls:
        mock_client = MagicMock()
        mock_client.cellar_id = "651553"
        mock_client.version = "1.0"
        mock_client._base_url = VALID_URL
        mock_client._refresh_version = AsyncMock(return_value="1.0")
        mock_client._fetch_deferred_page = AsyncMock(return_value={"props": {}})
        mock_client_cls.return_value = mock_client

        result = await flow.async_step_reauth_confirm(user_input=user_input)

    assert result["type"] == "abort"
    assert result["reason"] == "reauth_successful"
    assert reauth_entry.data[CONF_COOKIE] == new_cookie
    assert reauth_entry.data[CONF_CELLAR_URL] == VALID_URL
    assert reauth_entry.data[CONF_AI_TASK] == "ai_task.local"


def test_translation_files() -> None:
    """Test translation files are valid and contain matching keys."""
    import json
    from pathlib import Path

    base_dir = Path(__file__).parent.parent / "custom_components" / "vivino_cellar"
    strings_path = base_dir / "strings.json"
    en_path = base_dir / "translations" / "en.json"
    nl_path = base_dir / "translations" / "nl.json"

    assert strings_path.exists()
    assert en_path.exists()
    assert nl_path.exists()

    with open(strings_path, encoding="utf-8") as f:
        strings_data = json.load(f)
    with open(en_path, encoding="utf-8") as f:
        en_data = json.load(f)
    with open(nl_path, encoding="utf-8") as f:
        nl_data = json.load(f)

    assert en_data == strings_data

    # Check key parity between strings.json and nl.json
    def get_keys(d: dict, prefix: str = "") -> set[str]:
        keys = set()
        for k, v in d.items():
            full_key = f"{prefix}.{k}" if prefix else k
            keys.add(full_key)
            if isinstance(v, dict):
                keys.update(get_keys(v, full_key))
        return keys

    strings_keys = get_keys(strings_data)
    nl_keys = get_keys(nl_data)

    assert strings_keys == nl_keys

    # Verify expected config flow keys exist
    expected_keys = {
        "config.step.user.title",
        "config.step.user.description",
        "config.step.user.data.cellar_url",
        "config.step.user.data.cookie",
        "config.step.user.data.ai_task",
        "config.step.reauth_confirm.title",
        "config.step.reauth_confirm.description",
        "config.step.reauth_confirm.data.cookie",
        "config.error.invalid_auth",
        "config.error.invalid_url",
        "config.error.cannot_connect",
        "config.error.unknown",
        "config.abort.already_configured",
        "config.abort.reauth_successful",
    }
    assert expected_keys.issubset(strings_keys)
