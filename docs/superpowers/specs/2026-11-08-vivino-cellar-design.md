# Vivino Cellar for Home Assistant — Design

- **Repo:** `~/rob/github-rob/ha-vivino-cellar`, GitHub `robsonke/ha-vivino-cellar`
- **Integration domain:** `vivino_cellar`
- **Date:** 2026-11-08
- **Status:** approved by Rob (with Lovelace custom card addition)

Items marked **(my call)** were decided by the designer, not by Rob. Change them freely.

## 1. Intent

Rob keeps his wine cellar in Vivino (about 54 wines and 108 bottles today). He wants Home Assistant to answer two questions:

1. **"I'm eating X — which of my bottles fit?"** He should be able to ask by voice, on his phone or on the wall tablet.
2. **"What should I drink now, and what should keep ageing?"** This is an overview of the drinking window for every wine.

Once he has picked a bottle, he wants to tap a button that removes it from his Vivino cellar.

Vivino remains the master copy. Adding, searching and rating wines stays in the Vivino app. The integration reads the cellar, adds intelligence on top, and makes exactly one kind of write: removing a bottle.

The integration is published to the Home Assistant **Marketplace** (the built-in successor to HACS since HA 2026.11). It must therefore work for any Vivino user, country and language, not just Rob.

## 2. Goals, non-goals, anti-goals

### Goals (v1)

- **Pairing:** the user names a dish, or picks one or more Vivino food categories, and gets the best-fitting bottles from their own cellar, ranked, with location and drinking-window status. Picking food categories works without AI.
- **Drinking-window overview:** every wine in the cellar is grouped by status: hold, ready, near past peak, past peak and unknown.
- **AI-estimated windows** for wines where Vivino has none, clearly labelled as estimates.
- **"Drink this one" button** in the panel. It removes one bottle from the Vivino cellar.
- **Four ways in:** voice (Assist), a sidebar panel (phone and tablet), a Lovelace custom card (dashboards and wall tablets), and HA actions and sensors (automations).
- **Publishable:** a UI setup flow, re-authentication, English and Dutch translations, tests, CI and Marketplace-ready packaging.

### Non-goals (v1)

- **Gap analysis** ("you have no wine for fish"). This is planned for later. The data model must make it easy to add (see §6.4), but v1 has no UI or logic for it.
- **Adding wines:** no label or barcode scanning, manual entry, search or buy list. That all stays in Vivino.
- **Rack or grid visualisation.** Location is shown as text only (storage location plus bin).
- **Consumption history inside HA.** Vivino keeps the cellar history.
- **Prices, valuation, critic scores** and restaurant wine-list scanning.
- **Notifications** about drinking windows. The panel and sensors are enough, and users can build automations on the sensors.
- **Removing bottles by voice.** Voice is read-only.

### Anti-goals (would make it a failure even if it "works")

- **Using Vivino's mobile API** (`api.vivino.com`). Every login there requires Vivino's own app client credentials, which are embedded in their app. The integration must only use the user's own web session. Do not extract, ship or use the app's `client_id`/`client_secret`.
- **A second source of truth.** HA must never hold its own bottle inventory that can drift from Vivino. Everything except AI estimates and caches is read from Vivino.
- **Writing anything to Vivino other than bottle removal.**
- **Silent breakage.** If the session expires or Vivino changes its response shape, the user must see it: a repair or re-auth prompt, unavailable entities, and a clear error in the panel. Never show stale data as if it were current.
- **Needing its own AI API key.** The integration uses the AI the user has already configured in HA.

## 3. Constraints

- **Minimum HA version: 2026.11 (my call).** The Marketplace exists from that release, and AI Task has existed since 2025.8.
- **Vivino has no public API.** The integration uses the **web cellar endpoint** that vivino.com's own "Cellar" page uses (§5). It is undocumented and can change without notice. The README states this, along with "not affiliated with Vivino".
- **Authentication is a session cookie the user pastes.** HA cannot run a browser login, and many users sign in to Vivino with Google, so there's no password to use. The cookie expires, and the integration must handle that (§5.3).
- **Licence:** MIT **(my call)**. Rob can change it.
- **Prior art:** [BaconWappedBitcoin/ha-wine-cellar](https://github.com/BaconWappedBitcoin/ha-wine-cellar) ("Cork Dork", MIT) uses the same web endpoint. It is a useful reference for cookie handling, Inertia paging and, especially, the write path (`vivino_account.py`, `async_change_bottles`). Copying code is fine under MIT with attribution, but the design here is different: read-mostly, no local inventory.

## 4. Architecture (decided)

```
            ┌───────────────── Home Assistant ─────────────────┐
 Voice ───▶ │ Assist (Claude agent) ──▶ intent: suggest wine   │
 Panel ───▶ │ Sidebar panel ──websocket──▶ ┐                    │
 Autom. ──▶ │ Actions (vivino_cellar.*) ──▶ ├─▶ Pairing engine ─┼─▶ ai_task.generate_data
            │                               │   Window engine   │
            │ Sensors ◀── Coordinator ◀─────┘                   │
            │               │  ▲                                │
            │               ▼  │  Store (AI estimates, cache)   │
            └───────────────┼──┼────────────────────────────────┘
                            ▼  │
                 www.vivino.com (web cellar endpoint, session cookie)
```

- **Python custom integration** with a config flow, a `DataUpdateCoordinator` that polls the cellar, and HA's `Store` for local state.
- **Pairing engine:** a single function used by all ways in (§6.2).
- **Window engine:** computes each wine's status from Vivino's window or from the AI estimate (§6.3).
- **Frontend UI:** Lit web component registered both as a Lovelace custom card (`custom:vivino-cellar-card`) and mounted as a sidebar panel (§7.1).
- **Intent** registered for Assist (§7.2).
- **Actions and sensors** (§7.3).

## 5. Vivino data source

### 5.1 Reading the cellar

These are observations from Rob's account on 2026-11-06. They were verified in a browser session and with `curl`.

- **Cellar page:** `https://www.vivino.com/{locale}/cellars/{cellar_id}`. Example: `/nl/cellars/651553`. The user finds it under avatar menu → "Wijnkelder" (Cellar, marked "new"), and `/cellars` redirects to it.
- **The page is Inertia.js** (component `cellars/show_v2`). The wine data is *deferred*. Fetch it as JSON with:
  - `X-Inertia: true`
  - `X-Inertia-Version: <version>`
  - `X-Inertia-Partial-Component: cellars/show_v2`
  - `X-Inertia-Partial-Data: entries,total_count,overview`
  - `X-Requested-With: XMLHttpRequest`
  - `Accept: text/html, application/xhtml+xml`
  - the session `Cookie`
  - a normal browser `User-Agent`
- **`X-Inertia-Version` changes with every Vivino deploy.** Read it fresh from the `data-page` attribute of the HTML page, or handle Inertia's `409 Conflict` plus `X-Inertia-Location` response by re-reading it. Never hard-code it.
- **Paging:** `?page=N`, with 20 entries per page. Stop when the page is empty or when `total_count` is reached. Other query parameters seen in the page props: `ready_to_drink`, `wine_type_id`, `search`, `sort_by`, `sort_order`.
- **Without a valid session** the page answers `302` to `/{locale}/login?...`. That is the "session expired" signal.
- **AWS WAF** is present on the site (`aws-waf-token` cookie), but plain HTTP clients were not challenged during testing.
- **Parsing contract (my call):** a response that isn't the expected Inertia shape, or an entry missing a *required* field (`vintage.id`, wine name, bottle list), fails the whole refresh and raises a repair issue. Missing *optional* fields (year for non-vintage wines, region, grapes, foods, window, style, image) degrade that wine quietly, with one log warning per refresh.
- **One cellar per config entry.** A user with several Vivino cellars adds the integration once per cellar URL.

**Fields used (per entry):**

| Need | Path |
|---|---|
| Bottles and location | `extras.bottles[]` → `id`, `bottle_size_id`, `storage_location_id`, `bin`, `created_at`; `extras.count`; `user_vintage.cellar_count` |
| Identity | `vintage.id`, `vintage.year`, `vintage.name`, `vintage.wine.name`, `vintage.wine.winery.name`, `vintage.wine.region.name` (+ country), `vintage.wine.type_id`, grapes, image |
| Drinking window | `vintage.recommended_drinking_window` → `start_year`, `end_year`, `status` (numeric; e.g. `5` for 2024–2026). The meaning of `status` is unknown, so the integration computes its own status from the years (§6.3). |
| Food pairing | `vintage.wine.foods[]` → `id`, `name` (localised), `seo_name`, `weight` (seen as 0.5 or 0) |
| Style (fallback context) | `vintage.wine.style` → `name`, `body`, `acidity`, `food`, `description` |
| Rating | `vintage.statistics.ratings_average`, `ratings_count` |

**Overview block** (`overview`): `bottle_count`, distributions by type, country, region and grape, and `drinking_windows` with `hold`, `ready_to_drink`, `past_peak` and `unknown` (each with `total` and `vintage_ids`). Use this as a cross-check, not as the source of truth.

**Storage location names:** bottles carry `storage_location_id`, but the response does not include the location *name*. The builder must find where the web cellar page gets location names (another deferred prop, page props, or an endpoint). If no name is available, show only the bin, and the location ID as "Location n".

### 5.2 Removing a bottle (the only write)

- This was **not observed directly** during research. The builder must capture the request the web cellar page sends when a bottle is removed or marked as drunk. Use Cork Dork's `vivino_account.py` (`_load_write_context`, `async_change_bottles`) as a guide: it needs a fresh CSRF token pair (`csrf_token` / `XSRF-TOKEN` cookies plus the `<meta name="csrf-token">`) and posts a cellar event.
- **Live testing is allowed (Rob's decision).** The builder may remove real bottles from Rob's cellar to capture and test this write; Rob re-adds them in the Vivino app. Keep live writes to the minimum needed, and log which bottles were removed so Rob knows what to re-add. Scrub personal data before saving any capture as a test fixture. "Drink this one" ships in the first release.
- **Semantics:** remove exactly **one** bottle of a given vintage, recorded with the "drunk" reason if Vivino supports reasons. When a vintage has several bottles in different locations, the panel lets the user pick which one (§7.1).
- **If Vivino can only lower a vintage's count** and cannot target a specific `bottle_id`, the builder drops the per-bottle picker: the button becomes per vintage, `drink_bottle` takes `vintage_id`, and the panel still shows each bottle's location for the user to fetch it.
- **After a successful write**, refresh the coordinator immediately.
- **If the write fails**, show the error in the panel and change nothing locally (there is no local inventory to change).

### 5.3 Authentication and session lifecycle

- **Setup flow fields:**
  1. Cellar URL. Parse `locale` and `cellar_id` from it, and reject anything that isn't `https://www.vivino.com/{locale}/cellars/{id}`.
  2. Cookie. Accept either the bare `_ruby-web_session` value or a whole `Cookie:` header string.
  3. The AI Task entity to use. This field is optional and defaults to HA's preferred AI Task entity.
- **Validation:** one cellar fetch during setup. Show "cookie invalid or expired" or "cellar not found" as form errors.
- **Expiry:** when a fetch gets the login redirect (or a 401/403), raise `ConfigEntryAuthFailed`. This starts HA's standard **reauth flow**, which asks only for a new cookie. Entities become unavailable until then.
- **Cookie rotation:** if Vivino returns `Set-Cookie` for the session on a normal fetch, store the new value. This may extend the session, as Cork Dork found. **(my call)**
- **Privacy:** store the cookie in the config entry data, and redact it in diagnostics and logs.

### 5.4 Polling

- **Interval:** every 6 hours **(my call)**, plus a refresh right after "drink this one" and on demand through the `vivino_cellar.refresh` action, the "Refresh cellar" button entity (§7.3) and a refresh button in the panel header.
- **Request pacing:** keep paging gentle, with sequential requests and no parallel fan-out.

## 6. Logic

### 6.1 Data model

There is one config entry per Vivino cellar. The coordinator holds, per vintage:

- **Identity:** wine, winery, region, country, type, vintage year, grapes, image, rating.
- **Bottles:** a list with `bottle_id`, size, `storage_location_id`, location name (if known) and bin.
- **Window:** `start_year` and `end_year`, plus `source`, which is `vivino`, `ai_estimate` or `none`.
- **Foods:** a list of `{food_id, seo_name, name, weight}`.
- **Style:** name, body, acidity, food list.

### 6.2 Pairing engine

- **Input:** either dish text in any language, or one or more food categories picked from the cellar's food list (Rob's decision).
- **Step 1, dish to food categories:** with picked categories, skip this step and give each picked category weight 1.0. With dish text, call `ai_task.generate_data` on the configured AI Task entity with a structured output. The model gets the dish, plus the **closed list of Vivino food categories that occur in this cellar** (id, seo_name, localised name). It returns a ranked list of matching `food_id`s with weights, and optionally a short reason.
  - Using a closed list keeps the model inside Vivino's vocabulary. That makes scoring deterministic and keeps gap analysis possible later.
- **Step 2, score each vintage that has bottles:**
  - `match = Σ (dish_weight[f] × wine_weight[f])` over shared food ids.
  - Wines whose Vivino weight is 0 for a food still count, with a small weight **(my call)**.
  - When `foods` is empty, fall back to `style.food` if present.
- **Step 3, adjust by window status:** ready and near past peak score highest, hold is penalised, and past peak is kept but flagged. Show at most **3 vintages** **(my call)**; each lists all of its bottles. Break ties by rating.
- **No AI available (Rob's decision):** pairing falls back to Vivino's own food data. If no AI Task entity is configured or the AI call fails, free-text pairing says "AI not available, pick a food instead" and the panel switches to the food picker. Steps 2 and 3 never need AI. The drinking-window overview, Vivino windows, sensors and "drink this one" all keep working; AI window estimates are skipped and retried on the next refresh.
- **Output:**
  - Ranked vintages, each with match score, status, an explanation line ("fits beef, game") and bottle locations.
  - For voice, also a short spoken summary covering the top 1–2.
- **No match:** say so plainly, and name the closest wines with their caveat. Never invent bottles.
- **Language:** answer in the language of the HA instance or the request. Vivino food names are already localised by the cellar URL's locale.

### 6.3 Window engine

- **Status from years**, where *Y* is the current year:
  - **hold:** `start_year > Y`
  - **near past peak:** `end_year == Y`
  - **ready:** `start_year ≤ Y < end_year`
  - **past peak:** `end_year < Y`
  - **unknown:** no window
- The "near past peak" rule is **(my call)**. Vivino's numeric `status` is ignored.
- **AI estimates:** for vintages with no Vivino window, call AI Task once with the wine identity (wine, winery, region, type, grapes, vintage, style), asking for `start_year`, `end_year` and a confidence.
  - Store the result in `Store`, keyed by `vintage_id`, and never write it to Vivino.
  - Estimate only for vintages that have none yet. Estimates run in the background after a refresh, rate-limited.
  - The UI and the attributes show estimates as "AI estimate". If Vivino later supplies a window, it replaces the estimate.

### 6.4 Ready for gap analysis (not built in v1)

Keep the per-vintage food weights and the cellar-wide food category list available through the coordinator. Gap analysis then becomes a count of food categories with no ready bottle above a weight threshold, with no data-model change.

## 7. Interfaces

### 7.1 Frontend: Sidebar panel and Lovelace custom card

The frontend is built with HA's frontend conventions and Lit. It is packaged and served by the integration as both a **Lovelace Custom Card** and an auto-mounted **Sidebar Panel**.

- **Lovelace Custom Card (`type: custom:vivino-cellar-card`):**
  - Registered as a frontend dashboard resource automatically by the integration.
  - Can be added to any Lovelace dashboard (sections view, grid, panel view) on wall tablets or phones.
  - Optional card configuration:
    - `default_tab`: `"pairing"` | `"windows"` (default: `"pairing"`)
    - `tabs`: list of enabled tabs (e.g., show only pairing on a kitchen tablet)
    - `title`: optional custom header title
- **Sidebar Panel ("Wijnkelder"):**
  - Registered by the integration as a sidebar entry named "Wijnkelder"/"Wine cellar" for instant access without manual dashboard editing.
  - Hosts the full card component in full-page mode.
- **Tab "Pairing":**
  - A text field for the dish, plus a **food picker**: chips for every Vivino food category that occurs in the cellar, in Vivino's localised names. Picking one or more chips runs pairing directly, without AI. When AI is unavailable, the text field is hidden and only the picker shows.
  - Results as cards: wine name and vintage, image, why it fits, window status, and location plus bin per bottle.
  - Each bottle has a **"Drink this one"** button. It asks for confirmation, then removes that specific bottle (§5.2).
- **Tab "Drinking windows":**
  - All wines grouped by status (near past peak, ready, hold, past peak, unknown).
  - Each row shows window years, the source (Vivino or AI estimate), bottle count and location.
  - Searchable, and each row also has the "Drink this one" button.
- **Header:** last refresh time, a refresh button, and a visible error banner when the session has expired or the data shape is unexpected.
- **Communication:** the frontend talks to the integration over HA websocket commands registered by the integration (pairing, list, drink, refresh). It does not call Vivino directly.
- **Permissions (Rob's decision):** every HA user, admin or not, can open the panel/card, get pairings and press "Drink this one". Neither the panel nor the websocket commands or `drink_bottle` action check for admin. The confirmation step before removing is the only guard. Setup, reauth and options stay admin-only, as HA does by default.

### 7.2 Voice (Assist)

- Register an intent (for example `VivinoCellarSuggestWine`, with a free-text `dish` slot) that calls the pairing engine and returns a speech response.
- Rob's preferred pipeline uses the Claude conversation agent, which can call registered intents as tools.
- Add Dutch and English sentence support for HA's built-in agent where practical. Without an LLM, the built-in agent matches a `food` slot against the cellar's food category names ("welke wijn bij rundvlees") and calls the pairing engine with that category, so voice pairing also works without AI.
- Voice is **read-only**. It never removes bottles.
- **Must verify:** the intent is offered as a tool to the LLM conversation agents (Claude, Gemini) through HA's Assist API, and the default agent answers it.

### 7.3 Actions and entities

**Actions:**
- `vivino_cellar.suggest_pairing`: input `dish` (free text, needs AI) or `food_ids` (list, no AI); exactly one is required. Returns the ranked result.
- `vivino_cellar.drink_bottle`: input `bottle_id`. This is the same write the panel uses.
- `vivino_cellar.refresh`

**Sensors**, one set per config entry:
- Total bottles.
- Bottles per status: ready, near past peak, hold, past peak, unknown.

**Button**, one per config entry (Rob's request):
- "Refresh cellar" (`button` entity). Pressing it polls Vivino now, same as `vivino_cellar.refresh`. Usable from the device page, any dashboard and automations. Available to every user, like the panel.
- Presses within 30 seconds of the last refresh are ignored **(my call)**, to keep polling gentle.

Keep attributes small. Lists of wine names per status are OK; don't include full payloads.

The coordinator failing makes all entities unavailable. A repair issue explains why when it's a session problem.

## 8. Packaging and quality

- **Marketplace-ready:**
  - `manifest.json` with a version HA can parse.
  - Brand assets. At least `icon.png` is required under HACS rules. The builder must check the current Marketplace and HA developer documentation for custom-integration listing rules before the first release.
  - GitHub releases.
  - CI running hassfest and the Marketplace or HACS validation action.
- **Translations:** English and Dutch for the setup flow, reauth, errors, entities and panel strings.
- **Tests:**
  - The Vivino client against recorded fixtures, with personal data scrubbed: paging, version handling, login redirect, and the write with CSRF.
  - The pairing scorer and window engine as pure functions.
  - The config and reauth flows.
- **Diagnostics:** a redacted dump of the config entry and the last fetch metadata.
- **README:**
  - How to copy the cookie (DevTools → Application → Cookies → `_ruby-web_session`, or the full Cookie header from the Network tab).
  - How to find the cellar URL.
  - What happens on expiry.
  - Disclaimer: unofficial, private web API, may break, not affiliated with Vivino.
  - Attribution to Cork Dork for anything borrowed.

## 9. Left to the builder

- Frontend build tooling and component structure of the panel.
- Exact AI Task prompts and output schemas, within §6.2 and §6.3.
- Scoring constants: the zero-weight bonus and the status multipliers.
- How location names are resolved (§5.1), and how the write request is captured (§5.2).
- File and module layout, test framework setup, and CI details.

## 10. Open risks

| Risk | Effect | Mitigation |
|---|---|---|
| Vivino changes the cellar page or Inertia props | Fetch or parse fails | Strict parsing that fails loudly into a repair issue; fixtures make the fix fast |
| Session lifetime is short | Frequent re-paste of the cookie | Store rotated cookies (§5.3); clear reauth UX |
| WAF starts challenging non-browser clients | Integration stops working | Report clearly; no workaround in scope |
| The write endpoint is harder than expected | "Drink this one" is delayed | Read features ship independently; the write can follow in a minor release |
| Vivino terms of service | Platform risk for users | README disclaimer; user's own session only; gentle polling |
