# Vivino Cellar for Home Assistant 🍷

[![Marketplace](https://img.shields.io/badge/HA%20Marketplace-Custom-41BDF5.svg)](https://my.home-assistant.io/redirect/marketplace_repository/?owner=robsonke&repository=ha-vivino-cellar&category=integration)
[![GitHub Release](https://img.shields.io/github/v/release/robsonke/ha-vivino-cellar?include_prereleases&color=blue)](https://github.com/robsonke/ha-vivino-cellar/releases)
[![Validate](https://github.com/robsonke/ha-vivino-cellar/actions/workflows/validate.yml/badge.svg)](https://github.com/robsonke/ha-vivino-cellar/actions/workflows/validate.yml)
[![Tests](https://github.com/robsonke/ha-vivino-cellar/actions/workflows/tests.yml/badge.svg)](https://github.com/robsonke/ha-vivino-cellar/actions/workflows/tests.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Vivino Cellar** integrates your personal Vivino wine cellar into [Home Assistant](https://www.home-assistant.io/). Keep track of bottle counts, monitor drinking windows (hold, ready, can wait, near peak, past peak), discover food & wine pairings using Vivino food categories or Home Assistant Assist / AI, and mark bottles as drunk directly from your dashboard or voice assistant.

---

## Features

- 🍷 **Full Cellar Sync**: Automatically fetches your complete cellar inventory, storage locations, rack/bin placement, ratings, and wine styles.
- 🍽️ **Smart Wine & Food Pairing**:
  - **Quick category chips**: Select from pre-mapped Vivino food categories (Beef, Poultry, Pasta, Lamb, Rich Fish, Mature Cheeses, etc.).
  - **AI-Powered Dish Pairing**: Enter any dish description (e.g., *"Truffle risotto with parmesan and wild mushrooms"*) and let your Home Assistant Conversation agent (OpenAI, Anthropic, Ollama, etc.) analyze and rank matching bottles from your own cellar.
- ⏳ **Drinking Window Engine**: Categorizes your cellar into actionable drinking statuses:
  - **Ready**: In its ideal drinking window.
  - **Hold**: Still maturing; keep for upcoming years.
  - **Near Past Peak**: At the end of its drinking window; drink soon!
  - **Past Peak**: Beyond the recommended window.
  - **Unknown**: No window provided by Vivino; automatically estimated in the background via AI when a conversation entity is configured.
- 🍾 **"Drink this one"**: Mark bottles as drunk directly from Home Assistant. The integration syncs the bottle decrement back to Vivino's web cellar.
- 🗣️ **Voice with Assist**: Ask your smart speaker or Assist satellite:
  - *"Welke wijn past bij de risotto?"*
  - *"Welke wijn drinken we bij pasta met truffel?"*
  - Receive a spoken recommendation based on what you actually have in stock!
- 📊 **Sensors & Diagnostics**:
  - `sensor.vivino_cellar_total_bottles`
  - `sensor.vivino_cellar_bottles_ready` (window ends within 5 years)
  - `sensor.vivino_cellar_bottles_can_wait` (ready, but the window runs 5+ more years)
  - `sensor.vivino_cellar_bottles_hold`
  - `sensor.vivino_cellar_bottles_near_past_peak`
  - `sensor.vivino_cellar_bottles_past_peak`
  - `sensor.vivino_cellar_bottles_unknown`
  - `button.vivino_cellar_refresh` (with automatic 30s rate limiting)
  - Full Home Assistant Diagnostics support with sensitive cookie & token redaction.
- 📱 **Sidebar Panel & Lovelace Custom Card**:
  - Dedicated **Wijnkelder** panel in your Home Assistant sidebar (`mdi:barrel`).
  - Lovelace card (`custom:vivino-cellar-card`) for dashboard embedding.

---

## Installation

<!-- ha-marketplace:exclude-start -->
### Method 1: Home Assistant Marketplace (2026.11+)

[![Open your Home Assistant instance and open a repository in the Marketplace.](https://my.home-assistant.io/badges/marketplace_repository.svg)](https://my.home-assistant.io/redirect/marketplace_repository/?owner=robsonke&repository=ha-vivino-cellar&category=integration)

1. Click the badge above, or go to **Settings** → **Marketplace** → **Add from link** and enter `https://github.com/robsonke/ha-vivino-cellar` (category **Integration**).
2. Click **Download** on **Vivino Cellar**.
3. Restart Home Assistant.

On Home Assistant 2026.10 or older, add the same URL as a custom repository in HACS.

### Method 2: Manual Installation

1. Download the latest release from the [Releases](https://github.com/robsonke/ha-vivino-cellar/releases) page.
2. Copy the `custom_components/vivino_cellar` folder into your Home Assistant `<config_dir>/custom_components/` directory.
3. Restart Home Assistant.

<!-- ha-marketplace:exclude-end -->

---

## Setup Guide

Because Vivino does not provide a public developer API for private cellars, this integration connects to your personal web cellar endpoint using your session cookie.

### Step 1: Obtain your Cellar URL and Session Cookie

1. Open your web browser (Chrome, Firefox, Safari, or Edge) and navigate to [vivino.com](https://www.vivino.com).
2. Log into your Vivino account.
3. Go to your Cellar page (click your profile icon in the top right and select **Cellar**, or navigate to `https://www.vivino.com/cellar`).
4. Note the URL in the address bar. It will look like:
   ```text
   https://www.vivino.com/nl/cellars/1234567
   ```
   or:
   ```text
   https://www.vivino.com/users/your_username/cellar
   ```
5. Open your browser's **Developer Tools**:
   - Press `F12` or right-click anywhere and select **Inspect**.
   - Switch to the **Network** tab (or **Application / Storage > Cookies** tab).
   - If using the **Network** tab, refresh the page and click on the first document request (`cellar` or `cellars`).
   - In the **Request Headers**, locate the `Cookie:` header.
   - Look for the `_ruby-web_session` cookie value:
     ```text
     _ruby-web_session=BAh7CEk...
     ```
   - Copy either the entire `Cookie` header string or just `_ruby-web_session=...`.

### Step 2: Add the Integration in Home Assistant

1. In Home Assistant, go to **Settings > Devices & Services > Add Integration**.
2. Search for **Vivino Cellar**.
3. Fill in the configuration dialog:
   - **Cellar URL**: Your Vivino cellar URL (e.g. `https://www.vivino.com/nl/cellars/1234567`).
   - **Session Cookie**: The `_ruby-web_session` cookie value copied in Step 1.
   - **AI Task Entity (Optional)**: Select an `ai_task` entity (from e.g. OpenAI, Google Generative AI, Anthropic or Ollama) to enable free-text dish pairing and drinking window estimation for vintages without a Vivino window.
4. Click **Submit**. The initial cellar sync will begin immediately.

### Step 3: Name and settings (optional)

- **Name:** open the integration's ⋮ menu and choose **Rename**. The name appears in the sidebar and in the card header. Until you rename it, both show "Wijnkelder".
- **Settings:** click **Configure** on the integration:

| Setting | Default | What it does |
|---|---|---|
| AI task entity | (from setup) | Drinking-window estimates and dish pairing. Clear it to turn AI off. |
| Refresh interval | 6 h | How often the cellar is fetched from Vivino (1–24 h). |
| Show in sidebar | on | Turn off if you only use the dashboard card. |
| Wines in "Drink now" | 5 | How many wines the **Nu drinken** tab lists (1–20). |

Changes apply right away; the integration reloads itself.

> **Note on Session Expiry:** Vivino session cookies typically remain active for weeks or months. The integration automatically captures cookie rotations during normal requests to extend session longevity. If your session eventually expires, Home Assistant will prompt you to re-authenticate via a notification and config entry repair flow.

---

## Lovelace Card Configuration

The frontend card is automatically registered when the integration loads. You can add it to any Lovelace view.

### Basic Card

```yaml
type: custom:vivino-cellar-card
```

### Full Configuration Options

```yaml
type: custom:vivino-cellar-card
title: Mijn Wijnkelder
now_limit: 8
default_tab: now    # Options: "now", "pairing" or "cellar"
tabs:
  - now
  - pairing
  - cellar
```

### Configuration Parameters

| Option | Type | Default | Description |
|---|---|---|---|
| `type` | string | **Required** | Must be `custom:vivino-cellar-card` |
| `title` | string | Integration name | Header title. Overrides the integration's name for this card only |
| `now_limit` | number | Integration setting (5) | Wines on the **Nu drinken** tab, for this card only |
| `default_tab` | string | `"now"` | Initial tab to open (`"now"`, `"pairing"` or `"cellar"`) |
| `tabs` | list | `["now", "pairing", "cellar"]` | Which tabs to display. The old name `windows` still works and opens **Kelder** |

### Tabs

- **Nu drinken**: a short list of what to open now: wines in their last year first, then the rest of what's ready.
- **Wijn & Spijs**: food pairing from Vivino food categories, or free text via your AI task.
- **Kelder**: every wine in the cellar. Filter by drinking-window status (tap a pill), type, country, region, grape and number of bottles, and search by name, winery, region or grape. Sort by drinking window (grouped), drink-by year, rating, vintage, bottle count or name. Each filter's counts follow the other filters.

---

## Actions (Services)

### `vivino_cellar.suggest_pairing`

Find recommended wines from your cellar matching a dish description or food categories.

```yaml
action: vivino_cellar.suggest_pairing
data:
  dish: "Ribeye steak with garlic butter and grilled asparagus"
```

Or by Vivino food category ID:

```yaml
action: vivino_cellar.suggest_pairing
data:
  food_ids: [1, 5]
```

### `vivino_cellar.drink_bottle`

Mark a bottle as consumed and decrement the bottle count in Vivino.

```yaml
action: vivino_cellar.drink_bottle
data:
  bottle_id: 12345678
  vintage_id: 987654
```

### `vivino_cellar.refresh`

Manually trigger a cellar synchronization from Vivino (rate-limited to at most once every 30 seconds).

```yaml
action: vivino_cellar.refresh
```

---

## Voice Control with Assist

You can ask Home Assistant Assist for wine recommendations using natural speech:

- *"Welke wijn past bij de risotto?"*
- *"Welke wijn drinken we bij boeuf bourguignon?"*
- *"Geef me een wijnsuggestie voor vis"*
- *"Wat voor wijn drinken we bij pasta pesto?"*

Assist matches your request against your currently stocked wines, prioritizing bottles that are ready to drink, have high ratings, and match the dish's flavor profile.

**LLM conversation agents** (Claude, Gemini, OpenAI, etc.) can call the registered `VivinoCellarSuggestWine` intent as a tool directly.

For Home Assistant's **built-in Assist agent** (without an LLM), copy the included sentence files into your Home Assistant config and reload Assist:

```bash
cp -r custom_sentences <config_dir>/
```

Then run **Developer Tools → Actions → `conversation.reload`** (or restart Home Assistant). Example supported sentences include *"Welke wijn uit mijn kelder past bij biefstuk?"* and *"Which wine from my cellar pairs with steak?"*

---

## Diagnostics & Privacy

Vivino Cellar supports Home Assistant's built-in **Download Diagnostics** feature. All sensitive data (including session cookies, authentication tokens, usernames, and passwords) are automatically redacted using `async_redact_data` before being exported.

---

## Development

```bash
uv sync --group dev
uv run pytest            # unit tests
uvx ruff check . && uvx ruff format --check .
scripts/build_frontend.sh  # rebuild frontend/vivino-cellar-card.js from frontend/src/
```

Edit the card in `custom_components/vivino_cellar/frontend/src/` and run `scripts/build_frontend.sh`; Home Assistant serves the bundled `frontend/vivino-cellar-card.js`. Bump `version` in `manifest.json` (and `VERSION` in `panel.py`) for each release so browsers load the new card. Release tags must match the manifest version (`v0.2.0` ↔ `0.2.0`).

## Disclaimer

This project is an **unofficial**, open-source integration. It is **not** endorsed by, affiliated with, or supported by Vivino Inc. All wine information, images, and ratings are the property of Vivino and their respective owners. The integration uses private web endpoints and may be affected by changes to Vivino's website.

---

## Acknowledgments & Attribution

- Built with inspiration from and attribution to [BaconWappedBitcoin/ha-wine-cellar](https://github.com/BaconWappedBitcoin/ha-wine-cellar) ("Cork Dork", MIT), which explored Vivino's web cellar endpoints, session management, and CSRF token handling.
- Inspired by the Home Assistant community.
