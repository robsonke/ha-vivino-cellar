"""Tests for Vivino Cellar diagnostics platform."""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest

from custom_components.vivino_cellar.const import (
    CONF_CELLAR_URL,
    CONF_COOKIE,
    DOMAIN,
)
from custom_components.vivino_cellar.diagnostics import (
    async_get_config_entry_diagnostics,
)
from custom_components.vivino_cellar.models import Bottle, CellarData, Vintage


class MockConfigEntry:
    """Mock config entry for diagnostics testing."""

    def __init__(
        self,
        entry_id: str = "test_entry_id",
        unique_id: str = "651553",
        data: dict | None = None,
        options: dict | None = None,
    ) -> None:
        self.entry_id = entry_id
        self.unique_id = unique_id
        self.data = data or {
            CONF_CELLAR_URL: "https://www.vivino.com/nl/cellars/651553",
            CONF_COOKIE: "_ruby-web_session=secret_session_cookie_abc123",
            "token": "sensitive_auth_token_xyz",
            "email": "user@example.com",
            "username": "wine_lover_42",
        }
        self.options = options or {
            "password": "super_secret_password",
            "ai_task": "conversation.openai",
        }
        self.title = "Vivino Cellar 651553"
        self.version = 1
        self.domain = DOMAIN


class MockHass:
    """Mock HomeAssistant."""

    def __init__(self) -> None:
        self.data: dict = {}


@pytest.mark.asyncio
async def test_diagnostics_redaction() -> None:
    """Test that CONF_COOKIE and sensitive/personal identifiers are redacted."""
    hass = MockHass()
    entry = MockConfigEntry()

    diag = await async_get_config_entry_diagnostics(hass, entry)

    assert isinstance(diag, dict)
    assert "entry" in diag
    entry_dict = diag["entry"]

    # Sensitive values in data must be redacted
    data = entry_dict["data"]
    assert data[CONF_COOKIE] == "**REDACTED**"
    assert data["token"] == "**REDACTED**"
    assert data["email"] == "**REDACTED**"
    assert data["username"] == "**REDACTED**"

    # Non-sensitive value must be preserved
    assert data[CONF_CELLAR_URL] == "https://www.vivino.com/nl/cellars/651553"

    # Sensitive values in options must be redacted
    options = entry_dict["options"]
    assert options["password"] == "**REDACTED**"
    assert options["ai_task"] == "conversation.openai"


@pytest.mark.asyncio
async def test_diagnostics_with_coordinator_data() -> None:
    """Test diagnostics with active coordinator data present."""
    hass = MockHass()
    entry = MockConfigEntry()

    sample_vintage = Vintage(
        id=123,
        year=2018,
        name="Château Margaux",
        winery="Château Margaux",
        region="Margaux",
        country="France",
        type_id=1,
        grapes=["Cabernet Sauvignon"],
        image_url="https://images.vivino.com/labels/123.jpg",
        rating=4.7,
        ratings_count=1200,
        foods=[],
        style=None,
        bottles=[
            Bottle(
                id=999,
                size_id=1,
                storage_location_id=10,
                location_name="Rack 1",
                bin="A3",
                created_at="2022-01-01",
            )
        ],
        start_year=2024,
        end_year=2035,
        window_source="vivino",
    )

    cellar_data = CellarData(
        cellar_id="651553",
        locale="nl",
        total_count=1,
        vintages=[sample_vintage],
        food_categories=[],
    )

    coordinator = MagicMock()
    coordinator.data = cellar_data
    coordinator.last_update_success = True
    coordinator.ai_task_entity = "conversation.openai"
    coordinator._stored_ai_windows = {"123": {"start_year": 2024, "end_year": 2035}}

    hass.data = {DOMAIN: {entry.entry_id: coordinator}}

    diag = await async_get_config_entry_diagnostics(hass, entry)

    assert "coordinator" in diag
    coord_diag = diag["coordinator"]
    assert coord_diag["last_update_success"] is True
    assert coord_diag["ai_task_entity"] == "conversation.openai"
    assert coord_diag["stored_ai_windows_count"] == 1

    cellar_diag = coord_diag["cellar"]
    assert cellar_diag["total_bottles"] == 1
    assert cellar_diag["total_unique_wines"] == 1
    assert cellar_diag["vintages_count"] == 1
    assert len(cellar_diag["vintages"]) == 1
    v_diag = cellar_diag["vintages"][0]
    assert v_diag["id"] == 123
    assert v_diag["bottle_count"] == 1
    assert v_diag["ratings_average"] == 4.7


@pytest.mark.asyncio
async def test_diagnostics_without_coordinator() -> None:
    """Test diagnostics when coordinator is not present in hass.data."""
    hass = MockHass()
    entry = MockConfigEntry()

    diag = await async_get_config_entry_diagnostics(hass, entry)

    assert "entry" in diag
    assert "coordinator" not in diag


@pytest.mark.asyncio
async def test_diagnostics_with_coordinator_empty_data() -> None:
    """Test diagnostics when coordinator data is None or empty."""
    hass = MockHass()
    entry = MockConfigEntry()

    coordinator = MagicMock()
    coordinator.data = None
    coordinator.last_update_success = False
    coordinator.ai_task_entity = None
    coordinator._stored_ai_windows = {}

    hass.data = {DOMAIN: {entry.entry_id: coordinator}}

    diag = await async_get_config_entry_diagnostics(hass, entry)

    assert "coordinator" in diag
    assert diag["coordinator"]["last_update_success"] is False
    assert "cellar" not in diag["coordinator"]

