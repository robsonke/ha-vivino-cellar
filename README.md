# Vivino Cellar for Home Assistant 🍷

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/default)
[![GitHub Release](https://img.shields.io/github/v/release/robsonke/ha-vivino-cellar?include_prereleases&color=blue)](https://github.com/robsonke/ha-vivino-cellar/releases)
[![Validate](https://github.com/robsonke/ha-vivino-cellar/actions/workflows/validate.yml/badge.svg)](https://github.com/robsonke/ha-vivino-cellar/actions/workflows/validate.yml)
[![Tests](https://github.com/robsonke/ha-vivino-cellar/actions/workflows/tests.yml/badge.svg)](https://github.com/robsonke/ha-vivino-cellar/actions/workflows/tests.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Vivino Cellar** integrates your personal Vivino wine cellar into [Home Assistant](https://www.home-assistant.io/). Keep track of bottle counts, monitor drinking windows (hold, ready, near peak, past peak), discover food & wine pairings using Vivino food categories or Home Assistant Assist / AI, and mark bottles as drunk directly from your dashboard or voice assistant.

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
  - `sensor.vivino_cellar_bottles_ready`
  - `sensor.vivino_cellar_bottles_hold`
  - `sensor.vivino_cellar_bottles_near_past_peak`
  - `sensor.vivino_cellar_bottles_past_peak`
  - `sensor.vivino_cellar_bottles_unknown`
  - `button.vivino_cellar_refresh` (with automatic 30s rate limiting)
  - Full Home Assistant Diagnostics support with sensitive cookie & token redaction.
- 📱 **Sidebar Panel & Lovelace Custom Card**:
  - Dedicated **Wijnkelder** panel in your Home Assistant sidebar (`mdi:glass-wine`).
  - Lit-based Lovelace card (`custom:vivino-cellar-card`) for dashboard embedding.

---

## Installation

### Method 1: HACS (Custom Repository)

1. Open **HACS** in your Home Assistant interface.
2. Click the three dots in the top right corner and select **Custom repositories**.
3. Enter `https://github.com/robsonke/ha-vivino-cellar` in the **Repository** field.
4. Select **Integration** as the category.
5. Click **Add**, then find **Vivino Cellar** in the list and click **Download**.
6. Restart Home Assistant.

### Method 2: Manual Installation

1. Download the latest release from the [Releases](https://github.com/robsonke/ha-vivino-cellar/releases) page.
2. Copy the `custom_components/vivino_cellar` folder into your Home Assistant `<config_dir>/custom_components/` directory.
3. Restart Home Assistant.

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
default_tab: now    # Options: "now", "pairing" or "windows"
tabs:
  - now
  - pairing
  - windows
```

### Configuration Parameters

| Option | Type | Default | Description |
|---|---|---|---|
| `type` | string | **Required** | Must be `custom:vivino-cellar-card` |
| `title` | string | `"Wijnkelder"` | Header title for the card |
| `default_tab` | string | `"now"` | Initial tab to open (`"now"`, `"pairing"` or `"windows"`) |
| `tabs` | list | `["now", "pairing", "windows"]` | Which tabs to display |

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
