"""Tests for Vivino web client bottle removal (write operations)."""

import json
from unittest.mock import AsyncMock, MagicMock

import aiohttp
from multidict import CIMultiDict, CIMultiDictProxy
import pytest

from custom_components.vivino_cellar.exceptions import (
    HomeAssistantError,
    VivinoAuthError,
    VivinoConnectionError,
    VivinoError,
    VivinoParseError,
)
from custom_components.vivino_cellar.vivino_client import VivinoClient


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


HTML_WITH_CSRF_META = """<!DOCTYPE html>
<html>
<head>
    <meta name="csrf-token" content="csrf_meta_token_abc123">
</head>
<body>
    <div id="app" data-page='{"component":"cellars/show_v2","props":{},"url":"/nl/cellars/651553","version":"v_test_1"}'></div>
</body>
</html>
"""

HTML_WITHOUT_CSRF_META = """<!DOCTYPE html>
<html>
<head>
    <title>Vivino Cellar</title>
</head>
<body>
    <div id="app" data-page='{"component":"cellars/show_v2","props":{},"url":"/nl/cellars/651553","version":"v_test_1"}'></div>
</body>
</html>
"""


async def test_remove_bottle_success_with_csrf_meta():
    """Test successful bottle removal extracting CSRF token from meta tag."""
    session = AsyncMock()
    html_resp = MockResponse(status=200, text=HTML_WITH_CSRF_META)
    write_resp = MockResponse(status=200, json_data={"status": "ok"})

    session.get = MagicMock(return_value=html_resp)
    session.post = MagicMock(return_value=write_resp)

    client = VivinoClient(
        session=session,
        cellar_url="https://www.vivino.com/nl/cellars/651553",
        cookie="_ruby-web_session=session_test_val",
    )

    success = await client.async_remove_bottle(bottle_id=101, vintage_id=2001)

    assert success is True
    session.get.assert_called_once()
    session.post.assert_called_once()

    call_args, call_kwargs = session.post.call_args
    assert call_args[0] == "https://www.vivino.com/cellars/651553/events"
    assert call_kwargs["headers"]["X-CSRF-Token"] == "csrf_meta_token_abc123"
    assert call_kwargs["headers"]["X-Inertia"] == "true"
    assert call_kwargs["headers"]["X-Inertia-Version"] == "v_test_1"
    assert call_kwargs["json"] == {
        "bottle_id": 101,
        "vintage_id": 2001,
        "type": "consume",
        "count": 1,
    }


async def test_remove_bottle_success_with_csrf_cookie():
    """Test successful bottle removal extracting CSRF token from cookies when meta tag is absent."""
    session = AsyncMock()
    html_resp = MockResponse(
        status=200,
        text=HTML_WITHOUT_CSRF_META,
        headers={"Set-Cookie": "csrf_token=cookie_csrf_token_xyz; Path=/"},
    )
    write_resp = MockResponse(status=200, json_data={"status": "ok"})

    session.get = MagicMock(return_value=html_resp)
    session.post = MagicMock(return_value=write_resp)

    client = VivinoClient(
        session=session,
        cellar_url="https://www.vivino.com/nl/cellars/651553",
        cookie="_ruby-web_session=session_test_val",
    )

    success = await client.async_remove_bottle(bottle_id=101)

    assert success is True
    session.get.assert_called_once()
    session.post.assert_called_once()

    _, call_kwargs = session.post.call_args
    assert call_kwargs["headers"]["X-CSRF-Token"] == "cookie_csrf_token_xyz"
    assert call_kwargs["json"] == {
        "bottle_id": 101,
        "type": "consume",
        "count": 1,
    }


async def test_remove_bottle_fallback_to_vintage_decrement():
    """Test fallback to vintage decrement when bottle-specific event returns 404."""
    session = AsyncMock()
    html_resp = MockResponse(status=200, text=HTML_WITH_CSRF_META)
    bottle_fail_resp = MockResponse(status=404, text="Bottle not found")
    vintage_ok_resp = MockResponse(status=200, json_data={"status": "ok"})

    session.get = MagicMock(return_value=html_resp)
    session.post = MagicMock(side_effect=[bottle_fail_resp, vintage_ok_resp])

    client = VivinoClient(
        session=session,
        cellar_url="https://www.vivino.com/nl/cellars/651553",
        cookie="_ruby-web_session=session_test_val",
    )

    success = await client.async_remove_bottle(bottle_id=101, vintage_id=2001)

    assert success is True
    assert session.post.call_count == 2

    # First call had bottle_id
    first_call_kwargs = session.post.call_args_list[0][1]
    assert first_call_kwargs["json"]["bottle_id"] == 101

    # Second call fell back to vintage decrement
    second_call_kwargs = session.post.call_args_list[1][1]
    assert second_call_kwargs["json"] == {
        "vintage_id": 2001,
        "type": "consume",
        "count": 1,
    }


async def test_remove_bottle_cookie_rotation():
    """Test cookie rotation when write response returns Set-Cookie."""
    session = AsyncMock()
    html_resp = MockResponse(status=200, text=HTML_WITH_CSRF_META)
    write_resp = MockResponse(
        status=200,
        headers={
            "Set-Cookie": "_ruby-web_session=rotated_ruby_session_999; Path=/; HttpOnly"
        },
    )

    session.get = MagicMock(return_value=html_resp)
    session.post = MagicMock(return_value=write_resp)

    client = VivinoClient(
        session=session,
        cellar_url="https://www.vivino.com/nl/cellars/651553",
        cookie="_ruby-web_session=old_val",
    )

    success = await client.async_remove_bottle(bottle_id=101)

    assert success is True
    assert client.get_rotated_cookie() == "_ruby-web_session=rotated_ruby_session_999"


async def test_remove_bottle_auth_error_redirect_to_login():
    """Test auth error when fetching write context redirects to login."""
    session = AsyncMock()
    redirect_resp = MockResponse(
        status=302,
        headers={"Location": "https://www.vivino.com/nl/login"},
    )
    session.get = MagicMock(return_value=redirect_resp)

    client = VivinoClient(
        session=session,
        cellar_url="https://www.vivino.com/nl/cellars/651553",
        cookie="expired_session",
    )

    with pytest.raises(VivinoAuthError) as exc_info:
        await client.async_remove_bottle(bottle_id=101)

    assert isinstance(exc_info.value, HomeAssistantError)


async def test_remove_bottle_auth_error_on_post():
    """Test auth error when POST returns 401."""
    session = AsyncMock()
    html_resp = MockResponse(status=200, text=HTML_WITH_CSRF_META)
    unauth_resp = MockResponse(status=401, text="Unauthorized")

    session.get = MagicMock(return_value=html_resp)
    session.post = MagicMock(return_value=unauth_resp)

    client = VivinoClient(
        session=session,
        cellar_url="https://www.vivino.com/nl/cellars/651553",
        cookie="session_val",
    )

    with pytest.raises(VivinoAuthError) as exc_info:
        await client.async_remove_bottle(bottle_id=101)

    assert isinstance(exc_info.value, HomeAssistantError)


async def test_remove_bottle_connection_error():
    """Test connection error when POST raises a client error."""
    session = AsyncMock()
    html_resp = MockResponse(status=200, text=HTML_WITH_CSRF_META)

    session.get = MagicMock(return_value=html_resp)
    session.post = MagicMock(side_effect=aiohttp.ClientError("Network down"))

    client = VivinoClient(
        session=session,
        cellar_url="https://www.vivino.com/nl/cellars/651553",
        cookie="session_val",
    )

    with pytest.raises(VivinoConnectionError) as exc_info:
        await client.async_remove_bottle(bottle_id=101)

    assert isinstance(exc_info.value, HomeAssistantError)


async def test_remove_bottle_server_error_no_fallback():
    """Test server error when POST returns 500."""
    session = AsyncMock()
    html_resp = MockResponse(status=200, text=HTML_WITH_CSRF_META)
    server_error_resp = MockResponse(status=500, text="Internal Server Error")

    session.get = MagicMock(return_value=html_resp)
    session.post = MagicMock(return_value=server_error_resp)

    client = VivinoClient(
        session=session,
        cellar_url="https://www.vivino.com/nl/cellars/651553",
        cookie="session_val",
    )

    with pytest.raises(VivinoError) as exc_info:
        await client.async_remove_bottle(bottle_id=101)

    assert isinstance(exc_info.value, HomeAssistantError)


async def test_remove_bottle_missing_csrf_token():
    """Test error when no CSRF token can be found."""
    session = AsyncMock()
    html_resp = MockResponse(status=200, text=HTML_WITHOUT_CSRF_META)

    session.get = MagicMock(return_value=html_resp)

    client = VivinoClient(
        session=session,
        cellar_url="https://www.vivino.com/nl/cellars/651553",
        cookie="session_val",
    )

    with pytest.raises(VivinoParseError) as exc_info:
        await client.async_remove_bottle(bottle_id=101)

    assert isinstance(exc_info.value, HomeAssistantError)


async def test_remove_bottle_303_redirect_success():
    """Test that Inertia 303 redirect response is treated as success."""
    session = AsyncMock()
    html_resp = MockResponse(status=200, text=HTML_WITH_CSRF_META)
    redirect_resp = MockResponse(
        status=303,
        headers={"Location": "https://www.vivino.com/nl/cellars/651553"},
    )

    session.get = MagicMock(return_value=html_resp)
    session.post = MagicMock(return_value=redirect_resp)

    client = VivinoClient(
        session=session,
        cellar_url="https://www.vivino.com/nl/cellars/651553",
        cookie="session_val",
    )

    success = await client.async_remove_bottle(bottle_id=101)
    assert success is True
