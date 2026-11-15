"""Tests for Vivino web client."""

import json
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

from multidict import CIMultiDict, CIMultiDictProxy
import pytest

from custom_components.vivino_cellar.exceptions import (
    VivinoAuthError,
    VivinoParseError,
)
from custom_components.vivino_cellar.models import CellarData
from custom_components.vivino_cellar.vivino_client import VivinoClient

FIXTURES_DIR = Path(__file__).parent / "fixtures"


class MockResponse:
    """Mock aiohttp ClientResponse."""

    def __init__(self, status=200, text="", json_data=None, headers=None):
        self.status = status
        self._text = text
        self._json_data = json_data
        self.headers = CIMultiDictProxy(CIMultiDict(headers or {}))

    async def text(self):
        return self._text

    async def json(self):
        if self._json_data is not None:
            return self._json_data
        return json.loads(self._text)

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        return None


@pytest.fixture
def cellar_html():
    return (FIXTURES_DIR / "cellar_page.html").read_text()


@pytest.fixture
def cellar_p1_json():
    return json.loads((FIXTURES_DIR / "cellar_entries_p1.json").read_text())


def test_client_init_and_url_parsing():
    session = AsyncMock()
    client = VivinoClient(
        session=session,
        cellar_url="https://www.vivino.com/nl/cellars/651553",
        cookie="_ruby-web_session=secret123",
    )
    assert client.locale == "nl"
    assert client.cellar_id == "651553"
    assert client.get_rotated_cookie() is None

    # Test invalid url
    with pytest.raises(ValueError):
        VivinoClient(
            session=session,
            cellar_url="https://www.google.com",
            cookie="secret123",
        )


def test_parse_version_from_html(cellar_html):
    session = AsyncMock()
    client = VivinoClient(
        session=session,
        cellar_url="https://www.vivino.com/nl/cellars/651553",
        cookie="secret123",
    )
    version = client._extract_version_from_html(cellar_html)
    assert version == "abc123xyz"

    with pytest.raises(VivinoParseError):
        client._extract_version_from_html("<html><body>No data-page here</body></html>")


async def test_successful_fetch_cellar(cellar_html, cellar_p1_json):
    session = AsyncMock()
    html_resp = MockResponse(status=200, text=cellar_html)
    json_resp = MockResponse(status=200, json_data=cellar_p1_json)

    session.get = MagicMock(side_effect=[html_resp, json_resp])

    client = VivinoClient(
        session=session,
        cellar_url="https://www.vivino.com/nl/cellars/651553",
        cookie="secret123",
    )

    cellar_data = await client.async_fetch_cellar()

    assert isinstance(cellar_data, CellarData)
    assert cellar_data.cellar_id == "651553"
    assert cellar_data.locale == "nl"
    assert cellar_data.total_count == 1
    assert len(cellar_data.vintages) == 1

    vintage = cellar_data.vintages[0]
    assert vintage.id == 2001
    assert vintage.wine_id == 1001
    assert vintage.year == 2018
    assert vintage.name == "Barolo"
    assert vintage.winery == "Vietti"
    assert vintage.region == "Piedmont"
    assert vintage.country == "Italy"
    assert vintage.start_year == 2024
    assert vintage.end_year == 2030
    assert vintage.window_source == "vivino"
    assert len(vintage.bottles) == 2
    assert vintage.bottles[0].id == 1
    assert vintage.bottles[0].location_name == "Location 10"
    assert vintage.bottles[0].bin == "Rack A"
    assert vintage.bottles[1].id == 2
    assert vintage.bottles[1].location_name == "Location 11"
    assert vintage.bottles[1].bin == "Rack B"

    # Food categories collected
    assert len(cellar_data.food_categories) == 2
    assert {f.seo_name for f in cellar_data.food_categories} == {"beef", "game"}

    # Check headers on second call (deferred inertia call)
    calls = session.get.call_args_list
    assert len(calls) == 2
    p1_call = calls[1]
    headers = p1_call.kwargs.get("headers", {})
    assert headers.get("X-Inertia") == "true"
    assert headers.get("X-Inertia-Version") == "abc123xyz"
    assert headers.get("X-Inertia-Partial-Component") == "cellars/show_v2"
    assert headers.get("X-Inertia-Partial-Data") == "entries,total_count,overview"
    assert headers.get("X-Requested-With") == "XMLHttpRequest"
    assert headers.get("Accept") == "text/html, application/xhtml+xml"
    assert "secret123" in headers.get("Cookie", "")
    assert p1_call.kwargs.get("allow_redirects") is False


async def test_fetch_cellar_302_auth_redirect():
    session = AsyncMock()
    redirect_resp = MockResponse(
        status=302,
        headers={
            "Location": "https://www.vivino.com/nl/login?redirect_to=%2Fnl%2Fcellars%2F651553"
        },
    )
    session.get = MagicMock(return_value=redirect_resp)

    client = VivinoClient(
        session=session,
        cellar_url="https://www.vivino.com/nl/cellars/651553",
        cookie="expired_cookie",
    )

    with pytest.raises(VivinoAuthError):
        await client.async_fetch_cellar()


async def test_fetch_cellar_deferred_302_redirect(cellar_html):
    session = AsyncMock()
    html_resp = MockResponse(status=200, text=cellar_html)
    deferred_redirect = MockResponse(
        status=302,
        headers={"Location": "https://www.vivino.com/nl/login"},
    )
    session.get = MagicMock(side_effect=[html_resp, deferred_redirect])

    client = VivinoClient(
        session=session,
        cellar_url="https://www.vivino.com/nl/cellars/651553",
        cookie="expired_cookie",
    )

    with pytest.raises(VivinoAuthError):
        await client.async_fetch_cellar()


async def test_fetch_cellar_unauthorized_401():
    session = AsyncMock()
    session.get = MagicMock(return_value=MockResponse(status=401))

    client = VivinoClient(
        session=session,
        cellar_url="https://www.vivino.com/nl/cellars/651553",
        cookie="invalid_cookie",
    )

    with pytest.raises(VivinoAuthError):
        await client.async_fetch_cellar()


async def test_fetch_cellar_connection_error():
    import aiohttp

    session = AsyncMock()
    session.get = MagicMock(
        side_effect=aiohttp.ClientConnectionError("Failed to connect")
    )

    client = VivinoClient(
        session=session,
        cellar_url="https://www.vivino.com/nl/cellars/651553",
        cookie="cookie123",
    )

    from custom_components.vivino_cellar.exceptions import VivinoConnectionError

    with pytest.raises(VivinoConnectionError):
        await client.async_fetch_cellar()


async def test_cookie_rotation_complex_header(cellar_html, cellar_p1_json):
    session = AsyncMock()
    html_resp = MockResponse(
        status=200,
        text=cellar_html,
        headers={
            "Set-Cookie": "_ruby-web_session=new_secret_abc; Path=/; Domain=.vivino.com"
        },
    )
    json_resp = MockResponse(status=200, json_data=cellar_p1_json)

    session.get = MagicMock(side_effect=[html_resp, json_resp])

    client = VivinoClient(
        session=session,
        cellar_url="https://www.vivino.com/nl/cellars/651553",
        cookie="other=123; _ruby-web_session=old_secret; extra=foo",
    )

    await client.async_fetch_cellar()

    assert (
        client.get_rotated_cookie()
        == "other=123; _ruby-web_session=new_secret_abc; extra=foo"
    )


async def test_nv_vintage_and_none_storage_location(cellar_html):
    session = AsyncMock()
    html_resp = MockResponse(status=200, text=cellar_html)
    json_data = {
        "props": {
            "total_count": 1,
            "entries": [
                {
                    "vintage": {
                        "id": 5001,
                        "year": None,
                        "name": "Brut Reserve NV",
                        "wine": {
                            "name": "Brut Reserve",
                            "winery": {"name": "Billecart-Salmon"},
                            "region": "Champagne",
                            "country": "France",
                        },
                    },
                    "extras": {
                        "bottles": [
                            {
                                "id": 100,
                                "storage_location_id": None,
                                "created_at": "2026-02-01",
                            }
                        ]
                    },
                }
            ],
        }
    }
    session.get = MagicMock(
        side_effect=[html_resp, MockResponse(status=200, json_data=json_data)]
    )

    client = VivinoClient(
        session=session,
        cellar_url="https://www.vivino.com/en-US/cellars/987654",
        cookie="secret",
    )

    cellar = await client.async_fetch_cellar()
    assert len(cellar.vintages) == 1
    v = cellar.vintages[0]
    assert v.year is None
    assert v.name == "Brut Reserve"
    assert v.window_source == "none"
    assert v.bottles[0].location_name == "Unknown"
    assert v.bottles[0].storage_location_id is None


async def test_fetch_cellar_409_conflict_version_refresh(cellar_html, cellar_p1_json):
    session = AsyncMock()

    # Call 1: initial HTML fetch -> version abc123xyz
    html_resp1 = MockResponse(status=200, text=cellar_html)
    # Call 2: deferred fetch returns 409 Conflict with X-Inertia-Location
    conflict_resp = MockResponse(
        status=409,
        headers={"X-Inertia-Location": "https://www.vivino.com/nl/cellars/651553"},
    )
    # Call 3: re-fetch HTML for new version
    new_html = cellar_html.replace("abc123xyz", "new_version_456")
    html_resp2 = MockResponse(status=200, text=new_html)
    # Call 4: retry deferred fetch with new version -> succeeds
    p1_json_updated = dict(cellar_p1_json)
    p1_json_updated["version"] = "new_version_456"
    json_resp = MockResponse(status=200, json_data=p1_json_updated)

    session.get = MagicMock(
        side_effect=[html_resp1, conflict_resp, html_resp2, json_resp]
    )

    client = VivinoClient(
        session=session,
        cellar_url="https://www.vivino.com/nl/cellars/651553",
        cookie="secret123",
    )

    cellar_data = await client.async_fetch_cellar()

    assert cellar_data.total_count == 1
    assert client.version == "new_version_456"
    assert session.get.call_count == 4
    # The 4th call must have sent X-Inertia-Version: new_version_456
    fourth_call = session.get.call_args_list[3]
    assert fourth_call.kwargs["headers"]["X-Inertia-Version"] == "new_version_456"


async def test_cookie_rotation_tracking(cellar_html, cellar_p1_json):
    session = AsyncMock()
    html_resp = MockResponse(
        status=200,
        text=cellar_html,
        headers={
            "Set-Cookie": "_ruby-web_session=rotated_secret_999; path=/; HttpOnly"
        },
    )
    json_resp = MockResponse(status=200, json_data=cellar_p1_json)

    session.get = MagicMock(side_effect=[html_resp, json_resp])

    client = VivinoClient(
        session=session,
        cellar_url="https://www.vivino.com/nl/cellars/651553",
        cookie="_ruby-web_session=original_secret",
    )

    await client.async_fetch_cellar()

    assert client.get_rotated_cookie() == "_ruby-web_session=rotated_secret_999"


async def test_pagination(cellar_html, cellar_p1_json):
    session = AsyncMock()
    html_resp = MockResponse(status=200, text=cellar_html)

    # Page 1: 20 entries, total_count 25
    p1 = {
        "component": "cellars/show_v2",
        "props": {
            "total_count": 25,
            "entries": [cellar_p1_json["props"]["entries"][0]] * 20,
        },
    }
    # Page 2: 5 entries, total_count 25
    p2 = {
        "component": "cellars/show_v2",
        "props": {
            "total_count": 25,
            "entries": [cellar_p1_json["props"]["entries"][0]] * 5,
        },
    }

    session.get = MagicMock(
        side_effect=[
            html_resp,
            MockResponse(status=200, json_data=p1),
            MockResponse(status=200, json_data=p2),
        ]
    )

    client = VivinoClient(
        session=session,
        cellar_url="https://www.vivino.com/nl/cellars/651553",
        cookie="secret123",
    )

    cellar_data = await client.async_fetch_cellar()

    assert cellar_data.total_count == 25
    assert len(cellar_data.vintages) == 25
    assert session.get.call_count == 3


async def test_parse_error_on_corrupt_entry(cellar_html):
    session = AsyncMock()
    html_resp = MockResponse(status=200, text=cellar_html)
    corrupt_json = {
        "props": {
            "total_count": 1,
            "entries": [
                {
                    # Missing vintage and bottles
                    "something_else": 123
                }
            ],
        }
    }
    session.get = MagicMock(
        side_effect=[
            html_resp,
            MockResponse(status=200, json_data=corrupt_json),
        ]
    )

    client = VivinoClient(
        session=session,
        cellar_url="https://www.vivino.com/nl/cellars/651553",
        cookie="secret123",
    )

    with pytest.raises(VivinoParseError):
        await client.async_fetch_cellar()
