# Handoff: ha-vivino-cellar (from Claude Code session, 2026-11-08)

## What this is
A Home Assistant custom integration (domain `vivino_cellar`) on top of Rob's Vivino cellar:
1. Pairing: name a dish (AI) or pick Vivino food categories (no AI) → best bottles from the own cellar, with location and drinking-window status.
2. Drinking-window overview per wine (Vivino window, AI estimate when Vivino has none).
3. "Drink this one" button removes a bottle from the Vivino cellar.
4. Later (not v1): gap analysis, e.g. "no ready wine for fish".

Repo: `~/rob/github-rob/ha-vivino-cellar` (not a git repo yet; GitHub target `robsonke/ha-vivino-cellar`). Publish via HA Marketplace (HA 2026.11+), not HACS.

## Where we are
- Full design written and approved: `docs/superpowers/specs/2026-11-08-vivino-cellar-design.md` (includes Lovelace custom card + Sidebar panel). Source of truth.
- Design APPROVED by Rob on 2026-11-08.
- Next step: write the implementation plan (superpowers `writing-plans` style) to `docs/superpowers/plans/`, then build with TDD.
- Never push without Rob's explicit approval per push.

## Hard rules (Rob's)
- Data access must be API based. No exports, no HTML scrapers.
- Do NOT use Vivino's mobile API (`api.vivino.com`). Logging in needs the Vivino app's embedded OAuth client credentials; extracting or using them = impersonating the app. Ruled out for good.
- No own AI API key: reuse HA's configured AI Task entity (`ai_task.generate_data`).
- HA must not keep its own inventory; Vivino is the single source of truth.
- Adding/searching wines stays in the Vivino app. Only write = removing a bottle.
- No grid/shelf view (Rob dislikes Cork Dork's grid). Location + bin is enough.
- No notifications.

## Data source (verified working)
Vivino web cellar page is an Inertia.js page with deferred props:
- URL: `https://www.vivino.com/{locale}/cellars/{cellar_id}` (Rob: `/nl/cellars/651553`), paging `?page=N`, 20 per page. Rob has 54 entries / 108 bottles.
- Headers: `X-Inertia: true`, `X-Inertia-Version: <read fresh from the page's data-page attribute; changes per deploy>`, `X-Inertia-Partial-Component: cellars/show_v2`, `X-Inertia-Partial-Data: entries,total_count,overview`, `X-Requested-With: XMLHttpRequest`, `Accept: text/html, application/xhtml+xml`, browser User-Agent, Cookie.
- Auth: user's own `_ruby-web_session` cookie (Rails/Devise, HttpOnly), pasted in the config flow. Without it: 302 to `/{locale}/login`. Reauth flow on expiry. AWS WAF present, did not challenge.
- Useful fields per entry: `extras.bottles[]` (id, bottle_size_id, storage_location_id, bin, created_at), `extras.count`, `user_vintage.cellar_count`, `vintage.recommended_drinking_window` (start_year, end_year, status), `vintage.wine.foods[]` (id, localised name, seo_name, weight 0.5/0), `wine.style`, `vintage.statistics.ratings_average`, winery, region, type_id.
- `overview` block: distributions + drinking_windows (hold / past_peak / ready_to_drink / unknown).
- Bottle removal: not yet captured. Reference: Cork Dork (`github.com/BaconWappedBitcoin/ha-wine-cellar`, MIT), `custom_components/wine_cellar/vivino_account.py` → `_load_write_context` (CSRF from `csrf_token`/`XSRF-TOKEN` cookie + `<meta name="csrf-token">`) and `async_change_bottles`. Live testing on Rob's cellar is allowed; log removed bottles so Rob can re-add them.

## Rob's HA setup
- HA 2026.11.0, language nl, Europe/Amsterdam.
- AI Task: `ai_task.claude_ai_task`, `ai_task.google_ai_task`.
- Conversation: `conversation.claude_conversation`, `conversation.google_generative_ai`. Preferred pipeline "Claudeviool".
- Rob is an HA contributor (has ha-core, ha-brands clones in `~/rob/github-rob`).

## Decisions made in the design (check while reading)
Rob decided: live write tests allowed; every HA user may use panel + drink button (confirmation is the only guard); manual "Refresh cellar" button entity; non-AI food picker (chips from cellar food categories, `food_ids` on `suggest_pairing`, built-in voice agent matches food names).
Claude's calls: min HA 2026.11, MIT, poll every 6h, refresh button ignores presses within 30s, store rotated session cookies, "near past peak" = end_year == this year, Vivino numeric status ignored, max 3 vintages per pairing, zero-weight foods count a little, parsing contract (missing required field fails refresh + repair; optional fields degrade), one cellar per config entry, per-vintage drink button if Vivino can't target a single bottle.
