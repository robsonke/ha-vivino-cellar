"""Tests for reading and writing the user's own Vivino rating."""

from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.vivino_cellar.exceptions import (
    VivinoAuthError,
    VivinoError,
    VivinoParseError,
)
from custom_components.vivino_cellar.vivino_client import VivinoClient
from tests.test_vivino_client_write import MockResponse

USER_ID = 2905994
VINTAGE_ID = 180601747

HTML_WITH_USER = """<!DOCTYPE html>
<html><head><meta name="csrf-token" content="csrf_abc"></head>
<body><div id="app" data-page='{"component":"cellars/show_v2","props":{"auth":{"user":{"id":2905994}}},"url":"/nl/cellars/651553","version":"v1"}'></div></body>
</html>
"""

HTML_WITHOUT_USER = HTML_WITH_USER.replace(
    '"auth":{"user":{"id":2905994}}', '"auth":{}'
)

REVIEWS_URL = (
    f"https://www.vivino.com/api/users/{USER_ID}/vintages/{VINTAGE_ID}/reviews"
)


def _client(session):
    return VivinoClient(
        session=session,
        cellar_url="https://www.vivino.com/nl/cellars/651553",
        cookie="_ruby-web_session=abc",
    )


def _session(get_responses, **write):
    session = AsyncMock()
    session.get = MagicMock(side_effect=get_responses)
    for method, resp in write.items():
        setattr(session, method, MagicMock(return_value=resp))
    return session


def _reviews(*reviews):
    return MockResponse(status=200, json_data={"reviews": list(reviews)})


async def test_get_rating_returns_own_review():
    session = _session(
        [
            MockResponse(status=200, text=HTML_WITH_USER),
            _reviews({"id": 9, "rating": 4, "note": None, "created_at": "x"}),
        ]
    )
    rating = await _client(session).async_get_rating(VINTAGE_ID)

    assert rating == {"id": 9, "rating": 4.0, "note": None}
    assert session.get.call_args_list[1][0][0] == REVIEWS_URL


async def test_get_rating_none_when_not_rated():
    session = _session([MockResponse(status=200, text=HTML_WITH_USER), _reviews()])
    assert await _client(session).async_get_rating(VINTAGE_ID) is None


async def test_user_id_is_fetched_once():
    session = _session(
        [
            MockResponse(status=200, text=HTML_WITH_USER),
            _reviews(),
            _reviews(),
        ]
    )
    client = _client(session)
    await client.async_get_rating(VINTAGE_ID)
    await client.async_get_rating(VINTAGE_ID)
    assert session.get.call_count == 3


async def test_missing_user_id_raises_parse_error():
    session = _session([MockResponse(status=200, text=HTML_WITHOUT_USER)])
    with pytest.raises(VivinoParseError):
        await _client(session).async_get_rating(VINTAGE_ID)


async def test_rate_updates_existing_review():
    session = _session(
        [
            MockResponse(status=200, text=HTML_WITH_USER),
            _reviews({"id": 9, "rating": 4, "note": None}),
        ],
        put=MockResponse(
            status=200, json_data={"review": {"id": 9, "rating": 3.5, "note": "Prima"}}
        ),
    )
    result = await _client(session).async_rate_vintage(VINTAGE_ID, 3.5, "Prima")

    assert result == {"id": 9, "rating": 3.5, "note": "Prima"}
    args, kwargs = session.put.call_args
    assert args[0] == "https://www.vivino.com/api/reviews/9"
    assert kwargs["json"] == {"rating": 3.5, "note": "Prima"}
    assert kwargs["headers"]["X-CSRF-Token"] == "csrf_abc"
    assert kwargs["headers"]["Content-Type"] == "application/json"


async def test_rate_creates_review_when_not_rated():
    session = _session(
        [MockResponse(status=200, text=HTML_WITH_USER), _reviews()],
        post=MockResponse(
            status=201, json_data={"review": {"id": 11, "rating": 4.5, "note": None}}
        ),
    )
    result = await _client(session).async_rate_vintage(VINTAGE_ID, 4.5)

    assert result["id"] == 11
    args, kwargs = session.post.call_args
    assert args[0] == REVIEWS_URL
    assert kwargs["json"] == {"rating": 4.5}


async def test_rate_without_note_keeps_existing_note():
    """Omitting the note sends only the rating, so Vivino keeps the old note."""
    session = _session(
        [
            MockResponse(status=200, text=HTML_WITH_USER),
            _reviews({"id": 9, "rating": 4, "note": "Oud"}),
        ],
        put=MockResponse(status=200, json_data={"review": {"id": 9, "rating": 3}}),
    )
    await _client(session).async_rate_vintage(VINTAGE_ID, 3)
    assert session.put.call_args.kwargs["json"] == {"rating": 3.0}


@pytest.mark.parametrize("rating", [0, 0.5, 3.3, 5.5, -1])
async def test_rate_rejects_invalid_rating(rating):
    session = _session([])
    with pytest.raises(ValueError):
        await _client(session).async_rate_vintage(VINTAGE_ID, rating)
    session.get.assert_not_called()


async def test_rate_auth_error():
    session = _session(
        [MockResponse(status=200, text=HTML_WITH_USER), _reviews({"id": 9})],
        put=MockResponse(status=401, text=""),
    )
    with pytest.raises(VivinoAuthError):
        await _client(session).async_rate_vintage(VINTAGE_ID, 4)


async def test_rate_rejected_by_vivino():
    session = _session(
        [MockResponse(status=200, text=HTML_WITH_USER), _reviews()],
        post=MockResponse(status=422, json_data={"error": "nope"}),
    )
    with pytest.raises(VivinoError, match="422"):
        await _client(session).async_rate_vintage(VINTAGE_ID, 4)
