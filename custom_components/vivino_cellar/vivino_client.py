"""Client for Vivino web Inertia.js API."""

from __future__ import annotations

import asyncio
import html
from http.cookies import SimpleCookie
import json
import logging
import re
from typing import Any
from urllib.parse import urlparse

import aiohttp

from .exceptions import (
    VivinoAuthError,
    VivinoConnectionError,
    VivinoParseError,
)
from .models import Bottle, CellarData, FoodCategory, Vintage, WineStyle

_LOGGER = logging.getLogger(__name__)

URL_PATTERN = re.compile(
    r"^https?://(?:www\.)?vivino\.com/([a-zA-Z\-]+)/cellars/(\d+)/?$"
)
DATA_PAGE_PATTERN = re.compile(
    r"""data-page=(['"])(.*?)\1""",
    re.DOTALL,
)

DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)


class VivinoClient:
    """Vivino web client fetching cellar data via Inertia.js deferred props."""

    def __init__(
        self,
        session: aiohttp.ClientSession,
        cellar_url: str,
        cookie: str,
    ) -> None:
        """Initialize the client."""
        self._session = session
        self._cellar_url = cellar_url.strip()
        self._cookie = cookie.strip()
        self._current_cookie_header = self._format_cookie_header(self._cookie)
        self._rotated_cookie: str | None = None
        self.version: str | None = None

        match = URL_PATTERN.match(self._cellar_url)
        if not match:
            raise ValueError(
                f"Invalid Vivino cellar URL: {cellar_url}. "
                "Expected format: https://www.vivino.com/{locale}/cellars/{cellar_id}"
            )
        self.locale = match.group(1)
        self.cellar_id = match.group(2)
        self._base_url = f"https://www.vivino.com/{self.locale}/cellars/{self.cellar_id}"

    def get_rotated_cookie(self) -> str | None:
        """Return the rotated cookie if Set-Cookie was received, else None."""
        return self._rotated_cookie

    @staticmethod
    def _format_cookie_header(cookie_str: str) -> str:
        """Format cookie string for HTTP Cookie header."""
        if "=" not in cookie_str:
            return f"_ruby-web_session={cookie_str}"
        return cookie_str

    def _check_cookie_rotation(self, headers: Any) -> None:
        """Inspect response headers for Set-Cookie and track rotated session."""
        set_cookies = headers.getall("Set-Cookie", [])
        if not set_cookies:
            return

        for sc in set_cookies:
            cookie_obj = SimpleCookie()
            try:
                cookie_obj.load(sc)
            except Exception:
                continue

            if "_ruby-web_session" in cookie_obj:
                new_val = cookie_obj["_ruby-web_session"].value
                if self._cookie.startswith("_ruby-web_session="):
                    self._rotated_cookie = f"_ruby-web_session={new_val}"
                elif "=" not in self._cookie:
                    self._rotated_cookie = new_val
                else:
                    parts = [p.strip() for p in self._cookie.split(";")]
                    new_parts = []
                    updated = False
                    for p in parts:
                        if p.startswith("_ruby-web_session="):
                            new_parts.append(f"_ruby-web_session={new_val}")
                            updated = True
                        else:
                            new_parts.append(p)
                    if not updated:
                        new_parts.append(f"_ruby-web_session={new_val}")
                    self._rotated_cookie = "; ".join(new_parts)
                self._current_cookie_header = self._format_cookie_header(self._rotated_cookie)

    def _extract_version_from_html(self, html_content: str) -> str:
        """Extract Inertia version from HTML data-page attribute."""
        match = DATA_PAGE_PATTERN.search(html_content)
        if not match:
            raise VivinoParseError("Could not find data-page attribute in cellar page HTML")

        raw_page_data = match.group(2)
        unescaped = html.unescape(raw_page_data)
        try:
            page_data = json.loads(unescaped)
        except json.JSONDecodeError as err:
            raise VivinoParseError(f"Failed to parse data-page JSON: {err}") from err

        version = page_data.get("version")
        if not version:
            raise VivinoParseError("Missing 'version' key in data-page attribute")

        return str(version)

    async def _refresh_version(self, url: str) -> str:
        """Fetch HTML page to resolve current Inertia version."""
        headers = {
            "User-Agent": DEFAULT_USER_AGENT,
            "Cookie": self._current_cookie_header,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }
        try:
            async with self._session.get(url, headers=headers, allow_redirects=False) as response:
                self._check_cookie_rotation(response.headers)

                if response.status in (301, 302, 303, 307, 308):
                    location = response.headers.get("Location", "")
                    raise VivinoAuthError(
                        f"Session expired or login redirect: redirected to {location}"
                    )
                if response.status in (401, 403):
                    raise VivinoAuthError(f"Authentication failed with status {response.status}")
                if response.status != 200:
                    raise VivinoParseError(f"Unexpected HTTP status {response.status} fetching HTML")

                content = await response.text()
                version = self._extract_version_from_html(content)
                self.version = version
                return version
        except (VivinoAuthError, VivinoParseError):
            raise
        except (aiohttp.ClientError, asyncio.TimeoutError) as err:
            raise VivinoConnectionError(f"Connection error fetching cellar HTML: {err}") from err

    async def _fetch_deferred_page(self, page: int, retries: int = 1) -> dict[str, Any]:
        """Fetch deferred Inertia page data as JSON."""
        url = f"{self._base_url}?page={page}"
        headers = {
            "User-Agent": DEFAULT_USER_AGENT,
            "Cookie": self._current_cookie_header,
            "X-Inertia": "true",
            "X-Inertia-Version": self.version or "",
            "X-Inertia-Partial-Component": "cellars/show_v2",
            "X-Inertia-Partial-Data": "entries,total_count,overview",
            "X-Requested-With": "XMLHttpRequest",
            "Accept": "text/html, application/xhtml+xml",
        }

        try:
            async with self._session.get(url, headers=headers, allow_redirects=False) as response:
                self._check_cookie_rotation(response.headers)

                if response.status in (301, 302, 303, 307, 308):
                    location = response.headers.get("Location", "")
                    raise VivinoAuthError(
                        f"Session expired or login redirect: redirected to {location}"
                    )
                if response.status in (401, 403):
                    raise VivinoAuthError(f"Authentication failed with status {response.status}")

                if response.status == 409:
                    if retries > 0:
                        location = response.headers.get("X-Inertia-Location") or self._base_url
                        _LOGGER.debug("Inertia 409 Conflict. Refreshing version from %s", location)
                        await self._refresh_version(location)
                        return await self._fetch_deferred_page(page, retries=retries - 1)
                    raise VivinoParseError("Persistent 409 Conflict encountered fetching cellar data")

                if response.status != 200:
                    raise VivinoParseError(
                        f"Unexpected HTTP status {response.status} fetching page {page}"
                    )

                return await response.json()
        except (VivinoAuthError, VivinoParseError):
            raise
        except (aiohttp.ClientError, asyncio.TimeoutError) as err:
            raise VivinoConnectionError(f"Connection error fetching page {page}: {err}") from err

    def _parse_entry(self, entry: dict[str, Any]) -> Vintage:
        """Parse an Inertia entry into a Vintage model."""
        if not isinstance(entry, dict):
            raise VivinoParseError(f"Invalid entry, expected dict: {entry}")

        vintage_data = entry.get("vintage")
        if not isinstance(vintage_data, dict):
            raise VivinoParseError(f"Entry missing required 'vintage' dict: {entry}")

        vintage_id = vintage_data.get("id")
        if vintage_id is None:
            raise VivinoParseError("Entry missing required vintage.id")

        wine = vintage_data.get("wine") or {}
        wine_name = wine.get("name") or vintage_data.get("name")
        if not wine_name:
            raise VivinoParseError(f"Entry {vintage_id} missing wine name")

        # Bottles list is required
        extras = entry.get("extras") or {}
        bottles_data = extras.get("bottles")
        if bottles_data is None and "bottles" in entry:
            bottles_data = entry["bottles"]
        if bottles_data is None or not isinstance(bottles_data, list):
            raise VivinoParseError(f"Entry {vintage_id} missing bottle list")

        bottles: list[Bottle] = []
        for b in bottles_data:
            if not isinstance(b, dict) or "id" not in b:
                raise VivinoParseError(f"Invalid bottle data in entry {vintage_id}: {b}")
            bottle_id = b["id"]
            size_id = b.get("bottle_size_id") or b.get("size_id") or 1
            loc_id = b.get("storage_location_id")
            loc_name = b.get("location_name")
            if not loc_name:
                loc_name = f"Location {loc_id}" if loc_id is not None else "Unknown"
            bin_val = b.get("bin")
            created_at = str(b.get("created_at", ""))
            bottles.append(
                Bottle(
                    id=bottle_id,
                    size_id=size_id,
                    storage_location_id=loc_id,
                    location_name=loc_name,
                    bin=bin_val,
                    created_at=created_at,
                )
            )

        # Optional identity fields
        raw_year = vintage_data.get("year")
        year = None
        if raw_year is not None:
            try:
                y = int(raw_year)
                if y > 0:
                    year = y
            except (ValueError, TypeError):
                pass

        winery_obj = wine.get("winery") or {}
        winery = winery_obj.get("name", "") if isinstance(winery_obj, dict) else str(winery_obj)

        region_obj = wine.get("region") or {}
        region = region_obj.get("name", "") if isinstance(region_obj, dict) else str(region_obj)

        country = ""
        if isinstance(region_obj, dict):
            c = region_obj.get("country")
            country = c.get("name", "") if isinstance(c, dict) else (str(c) if c else "")
        if not country:
            c = wine.get("country")
            country = c.get("name", "") if isinstance(c, dict) else (str(c) if c else "")

        type_id = int(wine.get("type_id", 1))

        grapes: list[str] = []
        for g in wine.get("grapes", []):
            if isinstance(g, dict):
                grapes.append(g.get("name", ""))
            elif isinstance(g, str):
                grapes.append(g)

        img = vintage_data.get("image") or wine.get("image")
        image_url: str | None = None
        if isinstance(img, dict):
            image_url = img.get("location")
        elif isinstance(img, str):
            image_url = img
        elif "image_url" in vintage_data:
            image_url = vintage_data.get("image_url")

        stats = vintage_data.get("statistics") or wine.get("statistics") or {}
        ratings_avg = stats.get("ratings_average")
        rating = float(ratings_avg) if ratings_avg is not None else None
        ratings_count = int(stats.get("ratings_count", 0))

        foods: list[FoodCategory] = []
        for f in wine.get("foods", []):
            if isinstance(f, dict) and "id" in f:
                foods.append(
                    FoodCategory(
                        id=f["id"],
                        name=f.get("name", ""),
                        seo_name=f.get("seo_name", ""),
                        weight=float(f.get("weight", 0.0)),
                    )
                )

        style: WineStyle | None = None
        style_data = wine.get("style")
        if isinstance(style_data, dict):
            style = WineStyle(
                name=style_data.get("name", ""),
                body=float(style_data["body"]) if style_data.get("body") is not None else None,
                acidity=float(style_data["acidity"]) if style_data.get("acidity") is not None else None,
                food=style_data.get("food", []),
            )

        rec_win = vintage_data.get("recommended_drinking_window") or {}
        start_year = rec_win.get("start_year")
        end_year = rec_win.get("end_year")
        window_source = "vivino" if (start_year is not None or end_year is not None) else "none"

        return Vintage(
            id=vintage_id,
            year=year,
            name=wine_name,
            winery=winery,
            region=region,
            country=country,
            type_id=type_id,
            grapes=grapes,
            image_url=image_url,
            rating=rating,
            ratings_count=ratings_count,
            foods=foods,
            style=style,
            bottles=bottles,
            start_year=start_year,
            end_year=end_year,
            window_source=window_source,
        )

    async def async_fetch_cellar(self) -> CellarData:
        """Fetch all cellar vintages with pagination."""
        if not self.version:
            await self._refresh_version(self._base_url)

        vintages: list[Vintage] = []
        total_count: int = 0
        page = 1

        while True:
            data = await self._fetch_deferred_page(page)
            props = data.get("props") if isinstance(data, dict) and "props" in data else data
            if not isinstance(props, dict):
                raise VivinoParseError(f"Expected dict props in response, got {type(props)}")

            total_count = props.get("total_count", total_count)
            entries_data = props.get("entries")
            if entries_data is None:
                raise VivinoParseError("Missing 'entries' in Inertia response props")
            if not isinstance(entries_data, list):
                raise VivinoParseError(f"Expected list for 'entries', got {type(entries_data)}")

            if not entries_data:
                break

            for entry in entries_data:
                vintage = self._parse_entry(entry)
                vintages.append(vintage)

            if len(vintages) >= total_count or len(entries_data) < 20:
                break

            page += 1

        unique_foods: dict[int, FoodCategory] = {}
        for v in vintages:
            for f in v.foods:
                if f.id not in unique_foods:
                    unique_foods[f.id] = f

        return CellarData(
            cellar_id=self.cellar_id,
            locale=self.locale,
            total_count=total_count if total_count > 0 else len(vintages),
            vintages=vintages,
            food_categories=list(unique_foods.values()),
        )
