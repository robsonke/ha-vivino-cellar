# Vivino Cellar for Home Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Home Assistant custom integration (`vivino_cellar`) that reads a user's Vivino cellar via web Inertia.js endpoints, provides AI/category-based wine pairing, tracks drinking windows, provides standard entities, a Lovelace custom card, and a sidebar panel with bottle removal.

**Architecture:** A Python custom component utilizing `DataUpdateCoordinator` polling Vivino's web cellar endpoint every 6 hours, storing cached AI estimates in HA's `Store`. Pairing and window logic are pure functional engines decoupled from IO. A bundled Lit-based frontend web component registers both as a Lovelace custom card (`custom:vivino-cellar-card`) and as a Sidebar panel ("Wijnkelder").

**Tech Stack:** Python 3.13+, Home Assistant Core (2026.11+), aiohttp, pytest, pytest-asyncio, pytest-homeassistant-custom-component, Lit / JavaScript for Lovelace card.

**Spec:** `/Users/robsonke/rob/github-rob/ha-vivino-cellar/docs/superpowers/specs/2026-11-08-vivino-cellar-design.md`

## Global Constraints

- Domain: `vivino_cellar`
- Minimum Home Assistant version: 2026.11.0
- Target publication: Home Assistant Marketplace
- No access to Vivino mobile API (`api.vivino.com`) — use web cellar endpoint only
- No internal bottle inventory inside HA — Vivino is the single source of truth
- Session authentication via user's `_ruby-web_session` cookie; handle 302 login redirect as `ConfigEntryAuthFailed`
- Use HA's configured AI Task entity (`ai_task.generate_data`) for free-text dish parsing and drinking window estimation; do not require external API keys
- Pairing must work without AI via food category chips
- Write operations limited strictly to bottle removal ("Drink this one")
- Never push git commits to remote without explicit approval per push

## Review Focus

1. **Inertia Version Drift**: Vivino returns HTTP 409 Conflict with `X-Inertia-Location` when a frontend deploy occurs; client must re-read `data-page` from the HTML and retry seamlessly. (Covered in Task 4)
2. **Session Expiry Redirect**: Vivino redirects (302) to `/{locale}/login`; client must intercept 302 before aiohttp auto-follows to login HTML and raise `ConfigEntryAuthFailed`. (Covered in Task 4)
3. **Missing Location Names**: Bottles have `storage_location_id` without a textual location name in the response; model must fall back cleanly to `"Location <id>"` and bin. (Covered in Task 1 & Task 4)
4. **AI Task Unavailable / Failure**: Free-text pairing must gracefully fall back to advising the user to pick food categories, without raising unhandled errors or breaking the UI. (Covered in Task 3 & Task 6)
5. **Rapid Refresh Throttling**: Button entity and refresh actions must ignore triggers within 30 seconds of the last refresh to avoid Vivino WAF rate-limiting. (Covered in Task 8)

---

### Task 1: Scaffolding, Tooling & Core Data Models

**Files:**
- Create: `.gitignore`
- Create: `pyproject.toml`
- Create: `custom_components/vivino_cellar/__init__.py`
- Create: `custom_components/vivino_cellar/const.py`
- Create: `custom_components/vivino_cellar/models.py`
- Create: `custom_components/vivino_cellar/manifest.json`
- Test: `tests/test_models.py`

**Interfaces:**
- Consumes: None
- Produces:
  - `const.py`: `DOMAIN = "vivino_cellar"`, `CONF_CELLAR_URL`, `CONF_COOKIE`, `CONF_AI_TASK`
  - `models.py`:
    - `Bottle(id: int, size_id: int, storage_location_id: int | None, location_name: str, bin: str | None, created_at: str)`
    - `FoodCategory(id: int, name: str, seo_name: str, weight: float)`
    - `WineStyle(name: str, body: float | None, acidity: float | None, food: list[str])`
    - `Vintage(id: int, year: int | None, name: str, winery: str, region: str, country: str, type_id: int, grapes: list[str], image_url: str | None, rating: float | None, ratings_count: int, foods: list[FoodCategory], style: WineStyle | None, bottles: list[Bottle], start_year: int | None, end_year: int | None, window_source: str)`
    - `CellarData(cellar_id: str, locale: str, total_count: int, vintages: list[Vintage], food_categories: list[FoodCategory])`

- [ ] **Step 1: Initialize git repository and write `.gitignore` and `pyproject.toml`**

Run: `git init` in `/Users/robsonke/rob/github-rob/ha-vivino-cellar`.
Create `.gitignore` for Python, Node, `.pytest_cache`, and `__pycache__`.
Create `pyproject.toml` configuring pytest with `asyncio_mode = "auto"`.

- [ ] **Step 2: Write failing test for `models.py`**

Create `tests/test_models.py`:
```python
from custom_components.vivino_cellar.models import (
    Bottle,
    FoodCategory,
    Vintage,
    CellarData,
)


def test_models_instantiation():
    bottle = Bottle(
        id=1,
        size_id=1,
        storage_location_id=10,
        location_name="Rack A",
        bin="3B",
        created_at="2026-01-01",
    )
    food = FoodCategory(id=101, name="Rundvlees", seo_name="beef", weight=0.5)
    vintage = Vintage(
        id=2001,
        year=2018,
        name="Barolo",
        winery="Vietti",
        region="Piedmont",
        country="Italy",
        type_id=1,
        grapes=["Nebbiolo"],
        image_url=None,
        rating=4.4,
        ratings_count=120,
        foods=[food],
        style=None,
        bottles=[bottle],
        start_year=2024,
        end_year=2030,
        window_source="vivino",
    )
    cellar = CellarData(
        cellar_id="651553",
        locale="nl",
        total_count=1,
        vintages=[vintage],
        food_categories=[food],
    )
    assert cellar.vintages[0].bottles[0].bin == "3B"
    assert cellar.food_categories[0].name == "Rundvlees"
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pytest tests/test_models.py`
Expected: FAIL with `ModuleNotFoundError: No module named 'custom_components'`

- [ ] **Step 4: Implement `models.py`, `const.py`, and `manifest.json`**

Implement dataclasses in `custom_components/vivino_cellar/models.py`.
Add `manifest.json` with domain `"vivino_cellar"`, version `"0.1.0"`, and `"codeowners": ["@robsonke"]`.
Create empty `custom_components/vivino_cellar/__init__.py`.

- [ ] **Step 5: Run test to verify it passes**

Run: `pytest tests/test_models.py`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add .gitignore pyproject.toml custom_components/ tests/
git commit -m "feat: scaffold project and define cellar models"
```

---

### Task 2: Window Engine

**Files:**
- Create: `custom_components/vivino_cellar/window_engine.py`
- Test: `tests/test_window_engine.py`

**Interfaces:**
- Consumes: `models.Vintage`
- Produces:
  - `compute_window_status(start_year: int | None, end_year: int | None, current_year: int) -> str`
    Values returned: `"hold"`, `"ready"`, `"near_past_peak"`, `"past_peak"`, `"unknown"`
  - `WINDOW_STATUS_HOLD = "hold"`
  - `WINDOW_STATUS_READY = "ready"`
  - `WINDOW_STATUS_NEAR_PAST_PEAK = "near_past_peak"`
  - `WINDOW_STATUS_PAST_PEAK = "past_peak"`
  - `WINDOW_STATUS_UNKNOWN = "unknown"`

- [ ] **Step 1: Write failing tests for window calculations**

Create `tests/test_window_engine.py`:
```python
from custom_components.vivino_cellar.window_engine import (
    compute_window_status,
    WINDOW_STATUS_HOLD,
    WINDOW_STATUS_READY,
    WINDOW_STATUS_NEAR_PAST_PEAK,
    WINDOW_STATUS_PAST_PEAK,
    WINDOW_STATUS_UNKNOWN,
)


def test_window_status_hold():
    assert compute_window_status(2028, 2035, 2026) == WINDOW_STATUS_HOLD


def test_window_status_ready():
    assert compute_window_status(2024, 2028, 2026) == WINDOW_STATUS_READY


def test_window_status_near_past_peak():
    assert compute_window_status(2020, 2026, 2026) == WINDOW_STATUS_NEAR_PAST_PEAK


def test_window_status_past_peak():
    assert compute_window_status(2015, 2025, 2026) == WINDOW_STATUS_PAST_PEAK


def test_window_status_unknown():
    assert compute_window_status(None, None, 2026) == WINDOW_STATUS_UNKNOWN
    assert compute_window_status(2020, None, 2026) == WINDOW_STATUS_UNKNOWN
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_window_engine.py`
Expected: FAIL with `ModuleNotFoundError`

- [ ] **Step 3: Implement `window_engine.py`**

Implement `compute_window_status` according to spec:
- If `start_year is None or end_year is None`: return `"unknown"`
- If `start_year > current_year`: return `"hold"`
- If `end_year == current_year`: return `"near_past_peak"`
- If `start_year <= current_year < end_year`: return `"ready"`
- If `end_year < current_year`: return `"past_peak"`

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_window_engine.py`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add custom_components/vivino_cellar/window_engine.py tests/test_window_engine.py
git commit -m "feat: implement drinking window status engine"
```

---

### Task 3: Pairing Engine

**Files:**
- Create: `custom_components/vivino_cellar/pairing.py`
- Test: `tests/test_pairing.py`

**Interfaces:**
- Consumes: `models.Vintage`, `models.FoodCategory`, `window_engine.compute_window_status`
- Produces:
  - `PairingResult(vintage: Vintage, match_score: float, window_status: str, explanation: str)`
  - `score_vintages(vintages: list[Vintage], target_food_weights: dict[int, float], current_year: int, max_results: int = 3) -> list[PairingResult]`

- [ ] **Step 1: Write failing tests for pairing logic**

Create `tests/test_pairing.py`:
```python
from custom_components.vivino_cellar.models import Bottle, FoodCategory, Vintage
from custom_components.vivino_cellar.pairing import score_vintages


def test_pairing_scoring_and_ranking():
    bottle = Bottle(
        id=1,
        size_id=1,
        storage_location_id=1,
        location_name="Cellar",
        bin="1",
        created_at="2026-01-01",
    )
    v_ready = Vintage(
        id=1,
        year=2020,
        name="Cabernet",
        winery="W1",
        region="Bordeaux",
        country="France",
        type_id=1,
        grapes=["Cabernet Sauvignon"],
        image_url=None,
        rating=4.5,
        ratings_count=100,
        foods=[FoodCategory(id=10, name="Beef", seo_name="beef", weight=0.5)],
        style=None,
        bottles=[bottle],
        start_year=2022,
        end_year=2028,
        window_source="vivino",
    )
    v_hold = Vintage(
        id=2,
        year=2024,
        name="Young Bordeaux",
        winery="W2",
        region="Bordeaux",
        country="France",
        type_id=1,
        grapes=["Merlot"],
        image_url=None,
        rating=4.8,
        ratings_count=50,
        foods=[FoodCategory(id=10, name="Beef", seo_name="beef", weight=0.5)],
        style=None,
        bottles=[bottle],
        start_year=2028,
        end_year=2035,
        window_source="vivino",
    )
    v_no_bottles = Vintage(
        id=3,
        year=2019,
        name="Empty Wine",
        winery="W3",
        region="Rioja",
        country="Spain",
        type_id=1,
        grapes=["Tempranillo"],
        image_url=None,
        rating=4.9,
        ratings_count=200,
        foods=[FoodCategory(id=10, name="Beef", seo_name="beef", weight=0.5)],
        style=None,
        bottles=[],
        start_year=2022,
        end_year=2028,
        window_source="vivino",
    )

    # Target: Beef (id 10) weight 1.0
    results = score_vintages(
        [v_ready, v_hold, v_no_bottles], {10: 1.0}, current_year=2026, max_results=3
    )

    assert len(results) == 2
    assert (
        results[0].vintage.id == 1
    )  # v_ready outranks v_hold because hold is penalized
    assert results[0].window_status == "ready"
    assert "Beef" in results[0].explanation
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_pairing.py`
Expected: FAIL with `ModuleNotFoundError`

- [ ] **Step 3: Implement `pairing.py`**

Implement scoring:
- Filter out vintages where `len(bottles) == 0`.
- Food match score: $\sum (\text{target\_weight}[f] \times \text{wine\_weight}[f])$. If wine weight is 0.0, use bonus weight 0.1.
- Window multiplier: `ready` (1.2), `near_past_peak` (1.25), `hold` (0.6), `past_peak` (0.5), `unknown` (1.0).
- Final score = match_score $\times$ window_multiplier.
- Tie-break by `vintage.rating` (descending).
- Return top `max_results` (default 3) as `PairingResult`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_pairing.py`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add custom_components/vivino_cellar/pairing.py tests/test_pairing.py
git commit -m "feat: implement wine pairing scoring engine"
```

---

### Task 4: Vivino Web Client - Reading & Paging

**Files:**
- Create: `custom_components/vivino_cellar/vivino_client.py`
- Create: `custom_components/vivino_cellar/exceptions.py`
- Test: `tests/test_vivino_client.py`
- Test fixture: `tests/fixtures/cellar_page.html`
- Test fixture: `tests/fixtures/cellar_entries_p1.json`

**Interfaces:**
- Consumes: `models.CellarData`, `models.Vintage`, `models.Bottle`, `models.FoodCategory`
- Produces:
  - `exceptions.VivinoAuthError` (subclasses `HomeAssistantError`)
  - `exceptions.VivinoParseError` (subclasses `HomeAssistantError`)
  - `VivinoClient(session: aiohttp.ClientSession, cellar_url: str, cookie: str)`
    - `async async_fetch_cellar() -> CellarData`
    - `get_rotated_cookie() -> str | None`

- [ ] **Step 1: Create test fixtures for HTML page and Inertia deferred response**

In `tests/fixtures/cellar_page.html`, write HTML with `data-page='{"version":"abc123xyz"}'`.
In `tests/fixtures/cellar_entries_p1.json`, write a mock deferred Inertia payload containing `total_count: 1`, `entries: [...]` with 1 vintage and 2 bottles.

- [ ] **Step 2: Write failing tests for client read operations**

Create `tests/test_vivino_client.py`:
- Test parsing version from `data-page`
- Test successful deferred fetch with `X-Inertia` headers
- Test handling 302 login redirect (raising `VivinoAuthError`)
- Test handling 409 Conflict (retrying with new version from `X-Inertia-Location`)
- Test cookie rotation tracking when `Set-Cookie` is returned

- [ ] **Step 3: Run test to verify it fails**

Run: `pytest tests/test_vivino_client.py`
Expected: FAIL

- [ ] **Step 4: Implement `vivino_client.py` and `exceptions.py`**

Implement:
- URL parsing for `locale` and `cellar_id` from `cellar_url`.
- Version fetching from HTML `data-page` attribute with regex.
- Paged deferred fetch with headers: `X-Inertia: true`, `X-Inertia-Version`, `X-Inertia-Partial-Component: cellars/show_v2`, `X-Inertia-Partial-Data: entries,total_count,overview`, `X-Requested-With: XMLHttpRequest`.
- `allow_redirects=False`: intercept 302 status and raise `VivinoAuthError`.
- Handle 409 Conflict: parse `X-Inertia-Location`, fetch new version, retry.
- Parse entries into `models.Vintage`, `models.Bottle`, `models.FoodCategory`. Fall back to `"Location <id>"` if no location name is found.

- [ ] **Step 5: Run test to verify it passes**

Run: `pytest tests/test_vivino_client.py`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add custom_components/vivino_cellar/vivino_client.py custom_components/vivino_cellar/exceptions.py tests/
git commit -m "feat: implement Vivino Inertia client with version handling and auth detection"
```

---

### Task 5: Vivino Web Client - Bottle Removal (Write)

**Files:**
- Modify: `custom_components/vivino_cellar/vivino_client.py`
- Test: `tests/test_vivino_client_write.py`

**Interfaces:**
- Consumes: `VivinoClient`
- Produces:
  - `VivinoClient.async_remove_bottle(bottle_id: int, vintage_id: int | None = None) -> bool`

- [ ] **Step 1: Write failing test for bottle removal**

Create `tests/test_vivino_client_write.py`:
- Mock fetching write context (CSRF token extraction from `<meta name="csrf-token">` and `csrf_token` cookie)
- Mock posting bottle decrement / removal event to Vivino cellar endpoint
- Test error handling if write fails (raises `HomeAssistantError`)

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_vivino_client_write.py`
Expected: FAIL

- [ ] **Step 3: Implement `async_remove_bottle` in `vivino_client.py`**

Implement write path:
- Extract CSRF token from page and cookies.
- Post bottle change request with `X-CSRF-Token` header.
- If bottle-specific deletion succeeds, return True.
- If Vivino only supports vintage count decrement, fall back to decrementing count for `vintage_id`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_vivino_client_write.py`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add custom_components/vivino_cellar/vivino_client.py tests/test_vivino_client_write.py
git commit -m "feat: implement bottle removal write operation"
```

---

### Task 6: DataUpdateCoordinator & AI Estimation Store

**Files:**
- Create: `custom_components/vivino_cellar/coordinator.py`
- Test: `tests/test_coordinator.py`

**Interfaces:**
- Consumes: `VivinoClient`, `models.CellarData`, `window_engine`, `ai_task.generate_data`
- Produces:
  - `VivinoCellarCoordinator(hass, client, ai_task_entity)`
    - `data: CellarData`
    - `last_refresh_time: datetime`
    - `async async_suggest_pairing(dish: str | None, food_ids: list[int] | None) -> list[PairingResult]`
    - `async async_drink_bottle(bottle_id: int, vintage_id: int | None = None) -> None`

- [ ] **Step 1: Write failing test for coordinator update and AI window estimation**

Create `tests/test_coordinator.py`:
- Mock `VivinoClient.async_fetch_cellar` returning cellar data.
- Test 6-hour polling schedule.
- Test background AI window estimation: when a vintage has `start_year is None`, coordinator invokes `ai_task.generate_data` in background and persists to HA `Store`.
- Test `async_suggest_pairing` with free-text dish calling AI Task, and with `food_ids` calling pairing engine directly without AI.

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_coordinator.py`
Expected: FAIL

- [ ] **Step 3: Implement `coordinator.py`**

Implement `VivinoCellarCoordinator`:
- Subclass `DataUpdateCoordinator[CellarData]`.
- Set `update_interval = timedelta(hours=6)`.
- Use `homeassistant.helpers.storage.Store` to store AI estimated windows keyed by `vintage_id`.
- On refresh, merge stored AI estimates into vintages that lack Vivino windows.
- Background rate-limited AI task to estimate windows for unknown vintages.
- Implement `async_suggest_pairing`:
  - If `dish` is provided and `ai_task_entity` configured: call `hass.services.async_call("ai_task", "generate_data", ...)`, parse food category weights, pass to `score_vintages`.
  - If AI call fails or no AI task: raise clear error directing to category selection.
  - If `food_ids` provided: build target weights (`1.0` per id) and pass to `score_vintages`.
- Implement `async_drink_bottle`: calls client write, then triggers immediate `async_refresh()`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_coordinator.py`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add custom_components/vivino_cellar/coordinator.py tests/test_coordinator.py
git commit -m "feat: implement coordinator with AI estimation and pairing dispatcher"
```

---

### Task 7: Config Flow and Reauth Flow

**Files:**
- Create: `custom_components/vivino_cellar/config_flow.py`
- Create: `custom_components/vivino_cellar/strings.json`
- Create: `custom_components/vivino_cellar/translations/en.json`
- Create: `custom_components/vivino_cellar/translations/nl.json`
- Test: `tests/test_config_flow.py`

**Interfaces:**
- Consumes: `VivinoClient`, `const.CONF_CELLAR_URL`, `const.CONF_COOKIE`, `const.CONF_AI_TASK`
- Produces:
  - `VivinoCellarConfigFlow`
  - Reauth flow handling `VivinoAuthError` / `ConfigEntryAuthFailed`

- [ ] **Step 1: Write failing tests for config flow and reauth flow**

Create `tests/test_config_flow.py`:
- Test successful user step with validation of URL and Cookie.
- Test rejection of invalid cellar URL.
- Test failure on expired cookie (show form error `invalid_auth`).
- Test reauth flow: prompts for new cookie and updates entry.

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_config_flow.py`
Expected: FAIL

- [ ] **Step 3: Implement `config_flow.py` and translations**

Implement `config_flow.py`:
- Form schema: `CONF_CELLAR_URL` (text), `CONF_COOKIE` (text), `CONF_AI_TASK` (optional entity selector).
- Validation: attempt single page fetch via `VivinoClient`.
- `async_step_reauth` and `async_step_reauth_confirm`: prompt for updated cookie.
- Add English and Dutch translation strings for all steps and errors.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_config_flow.py`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add custom_components/vivino_cellar/config_flow.py custom_components/vivino_cellar/strings.json custom_components/vivino_cellar/translations/ tests/test_config_flow.py
git commit -m "feat: implement config flow and reauth flow with nl and en translations"
```

---

### Task 8: Entities (Sensors & Refresh Button)

**Files:**
- Create: `custom_components/vivino_cellar/sensor.py`
- Create: `custom_components/vivino_cellar/button.py`
- Modify: `custom_components/vivino_cellar/__init__.py`
- Test: `tests/test_sensor.py`
- Test: `tests/test_button.py`

**Interfaces:**
- Consumes: `coordinator.VivinoCellarCoordinator`
- Produces:
  - Sensors: `total_bottles`, `ready`, `near_past_peak`, `hold`, `past_peak`, `unknown`
  - Button: `refresh_cellar` (30s debounce rate limit)

- [ ] **Step 1: Write failing tests for sensors and button**

Create `tests/test_sensor.py` and `tests/test_button.py`:
- Test sensors report accurate bottle counts per status.
- Test button entity calls `coordinator.async_refresh()`.
- Test button ignores presses occurring within 30 seconds of previous refresh.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pytest tests/test_sensor.py tests/test_button.py`
Expected: FAIL

- [ ] **Step 3: Implement `sensor.py`, `button.py`, and `async_setup_entry` in `__init__.py`**

- In `sensor.py`: create `CoordinatorEntity` sensors for total bottle count and status breakdown.
- In `button.py`: create `VivinoRefreshButton` with timestamp tracking; reject/log if `< 30s` since last refresh.
- In `__init__.py`: initialize coordinator, register platforms (`sensor`, `button`), and handle cookie rotation updates to config entry.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pytest tests/test_sensor.py tests/test_button.py`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add custom_components/vivino_cellar/sensor.py custom_components/vivino_cellar/button.py custom_components/vivino_cellar/__init__.py tests/
git commit -m "feat: add cellar sensors and debounced refresh button"
```

---

### Task 9: Actions (Services) & Assist Voice Intent

**Files:**
- Create: `custom_components/vivino_cellar/services.py`
- Create: `custom_components/vivino_cellar/intent.py`
- Modify: `custom_components/vivino_cellar/__init__.py`
- Test: `tests/test_services.py`
- Test: `tests/test_intent.py`

**Interfaces:**
- Consumes: `coordinator.VivinoCellarCoordinator`
- Produces:
  - Action `vivino_cellar.suggest_pairing` (returns response data)
  - Action `vivino_cellar.drink_bottle`
  - Action `vivino_cellar.refresh`
  - Intent `VivinoCellarSuggestWine`

- [ ] **Step 1: Write failing tests for actions and intent**

Create `tests/test_services.py` and `tests/test_intent.py`:
- Test `vivino_cellar.suggest_pairing` action response schema with top bottles and locations.
- Test `vivino_cellar.drink_bottle` triggers bottle removal.
- Test intent returns spoken summary for Assist and Claude conversation pipeline.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pytest tests/test_services.py tests/test_intent.py`
Expected: FAIL

- [ ] **Step 3: Implement `services.py` and `intent.py`**

- In `services.py`: register `suggest_pairing`, `drink_bottle`, `refresh` with `supports_response=SupportsResponse.ONLY` for pairing.
- In `intent.py`: register `VivinoCellarSuggestWine` intent handler returning speech for Assist.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pytest tests/test_services.py tests/test_intent.py`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add custom_components/vivino_cellar/services.py custom_components/vivino_cellar/intent.py tests/
git commit -m "feat: implement actions and Assist voice intent"
```

---

### Task 10: WebSocket API for Frontend

**Files:**
- Create: `custom_components/vivino_cellar/websocket_api.py`
- Modify: `custom_components/vivino_cellar/__init__.py`
- Test: `tests/test_websocket_api.py`

**Interfaces:**
- Consumes: `coordinator.VivinoCellarCoordinator`
- Produces:
  - WS command: `vivino_cellar/cellar` (returns cellar overview & wines list)
  - WS command: `vivino_cellar/pairing` (runs pairing for dish or food_ids)
  - WS command: `vivino_cellar/drink` (calls drink bottle)
  - WS command: `vivino_cellar/refresh` (triggers cellar refresh)

- [ ] **Step 1: Write failing test for WebSocket commands**

Create `tests/test_websocket_api.py`:
- Test `vivino_cellar/cellar` returns grouped wines, food category list, and refresh timestamp.
- Test `vivino_cellar/pairing` returns ranked results.
- Test `vivino_cellar/drink` invokes drink bottle and triggers refresh.
- Test non-admin permissions allow calling these commands.

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_websocket_api.py`
Expected: FAIL

- [ ] **Step 3: Implement `websocket_api.py`**

Implement WebSocket commands decorated with `@websocket_api.websocket_command`:
- Validate arguments using `voluptuous`.
- Check permissions: accessible to all authenticated users (no admin-only requirement).
- Register commands in `async_setup_entry`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_websocket_api.py`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add custom_components/vivino_cellar/websocket_api.py tests/test_websocket_api.py
git commit -m "feat: add WebSocket API endpoints for frontend UI"
```

---

### Task 11: Frontend Component - Lovelace Card & Sidebar Panel

**Files:**
- Create: `custom_components/vivino_cellar/frontend/src/vivino-cellar-card.js`
- Create: `custom_components/vivino_cellar/frontend/src/styles.js`
- Create: `custom_components/vivino_cellar/panel.py`
- Modify: `custom_components/vivino_cellar/__init__.py`
- Test: `tests/test_panel.py`

**Interfaces:**
- Consumes: WebSocket API (`vivino_cellar/*`)
- Produces:
  - Custom Lovelace Card: `custom:vivino-cellar-card` (configured with `default_tab`, `tabs`, `title`)
  - Sidebar Panel: `"Wijnkelder"` (registered via `async_register_panel`)
  - UI Tabs: "Pairing" (chips + text search + results) and "Drinking windows" (grouped lists + search + drink confirmation)

- [ ] **Step 1: Write failing test for panel and Lovelace card resource registration**

Create `tests/test_panel.py`:
- Test that `async_setup_entry` registers the static path for frontend assets.
- Test that sidebar panel `"vivino_cellar"` / `"Wijnkelder"` is registered with `frontend.async_register_panel`.
- Test that dashboard resource for `custom:vivino-cellar-card` is registered.

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_panel.py`
Expected: FAIL

- [ ] **Step 3: Implement Lit frontend component and `panel.py`**

- In `custom_components/vivino_cellar/frontend/`:
  - Build Lit element `<vivino-cellar-card>` and register `customElements.define("vivino-cellar-card", VivinoCellarCard)`.
  - Push card to `window.customCards`.
  - Support tabs: "Pairing" and "Drinking windows".
  - Pairing tab: input dish text + food category chips; card list with wine details, window status badge, location/bin, and "Drink this one" button.
  - Drinking windows tab: wines grouped by `ready`, `near_past_peak`, `hold`, `past_peak`, `unknown` with search bar and "Drink this one" button.
  - "Drink this one" action prompts for confirmation modal before calling `vivino_cellar/drink`.
- In `panel.py`:
  - Serve static directory `/vivino_cellar_frontend/`.
  - Register panel with `hass.components.frontend.async_register_panel`.
  - Register Lovelace resource with URL `/vivino_cellar_frontend/vivino-cellar-card.js`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_panel.py`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add custom_components/vivino_cellar/frontend/ custom_components/vivino_cellar/panel.py tests/test_panel.py
git commit -m "feat: implement Lit Lovelace custom card and sidebar panel"
```

---

### Task 12: Diagnostics, Marketplace Packaging, Brand Assets & Documentation

**Files:**
- Create: `custom_components/vivino_cellar/diagnostics.py`
- Create: `custom_components/vivino_cellar/icon.png`
- Create: `README.md`
- Create: `LICENSE`
- Test: `tests/test_diagnostics.py`

**Interfaces:**
- Consumes: Config entry, coordinator data
- Produces:
  - `async_get_config_entry_diagnostics(hass, entry) -> dict`
  - Marketplace metadata and documentation

- [ ] **Step 1: Write failing test for diagnostics redaction**

Create `tests/test_diagnostics.py`:
- Test that `async_get_config_entry_diagnostics` redacts `CONF_COOKIE` and personal identifiers.

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_diagnostics.py`
Expected: FAIL

- [ ] **Step 3: Implement `diagnostics.py`, brand assets, and `README.md`**

- Implement `diagnostics.py` using `async_redact_data`.
- Create `LICENSE` (MIT).
- Create `README.md` with:
  - Setup guide: finding cellar URL, copying `_ruby-web_session` cookie via browser DevTools.
  - Dashboard usage: adding `type: custom:vivino-cellar-card` to Lovelace.
  - Disclaimer: unofficial, private web API, not affiliated with Vivino.
  - Attribution to Cork Dork (`ha-wine-cellar`).

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_diagnostics.py`
Expected: PASS

- [ ] **Step 5: Run full test suite to verify 100% pass rate**

Run: `pytest tests/ -v`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add custom_components/vivino_cellar/diagnostics.py README.md LICENSE tests/
git commit -m "feat: add diagnostics, documentation, and Marketplace packaging"
```
