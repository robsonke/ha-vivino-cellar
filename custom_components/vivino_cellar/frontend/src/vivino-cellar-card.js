/**
 * Vivino Cellar card and sidebar panel (Lit).
 *
 * The root owns all state, the WebSocket connection, drinking with undo and
 * rating. Tabs and pieces are child elements that receive properties and
 * report back with `vc-*` events.
 */
import { LitElement, css, html, nothing } from "lit";

import "./components/toast-stack.js";
import { EMPTY_FILTERS } from "./logic/filters.js";
import { STATUS_ORDER } from "./logic/status.js";
import { bottleId, bottleSpots, viewWines, vintageId } from "./logic/util.js";
import { themeStyles, tokenStyles } from "./styles/theme.js";

const DEFAULT_TABS = ["now", "pairing", "cellar"];
const TAB_ALIASES = { windows: "cellar" }; // old name of the Kelder tab
const TAB_LABELS = { now: "Nu drinken", pairing: "Wijn & Spijs", cellar: "Kelder" };
const DEFAULT_TITLE = "Wijnkelder";
const DEFAULT_NOW_LIMIT = 5;
const UNDO_MS = 8000;
const ERROR_TOAST_MS = 8000;

export class VivinoCellarCard extends LitElement {
  static properties = {
    hass: { attribute: false },
    narrow: { type: Boolean },
    panel: { attribute: false },
    _config: { state: true },
    _data: { state: true },
    _loading: { state: true },
    _error: { state: true },
    _refreshing: { state: true },
    _tab: { state: true },
    _errors: { state: true },
    _detailId: { state: true },
    _pickerId: { state: true },
    _ratingDraft: { state: true },
    _statusFilter: { state: true },
    _filters: { state: true },
    _query: { state: true },
    _expanded: { state: true },
    _chip: { state: true },
    _pairing: { state: true },
  };

  constructor() {
    super();
    this._config = this._parseConfig({});
    this._tab = this._config.default_tab;
    this._data = null;
    this._loading = false;
    this._error = null;
    this._refreshing = false;
    this._pending = new Map(); // bottle id -> {timer, startedAt, vintageId, label, committing}
    this._errors = [];
    this._detailId = null;
    this._pickerId = null;
    this._myRatings = new Map(); // vintage id -> {rating, note} | null
    this._ratingDraft = null; // {vid, rating, note, status, error}
    this._statusFilter = null;
    this._filters = { ...EMPTY_FILTERS };
    this._query = "";
    this._expanded = { near_past_peak: true, ready: true, can_wait: false, hold: false, past_peak: false, unknown: false };
    this._chip = null;
    this._chipTouched = false; // the user picked a chip; the weather no longer preselects
    this._pairing = { dish: "", foodIds: new Set(), results: null, loading: false, error: null };
    this._unsubscribe = null;
    this._subscribing = false;

    this._onPageHide = () => this._flushPending();
    this._onKeyDown = (e) => {
      if (e.key === "Escape" && (this._pickerId !== null || this._detailId !== null)) this._closeModal();
    };
    this._listen();
  }

  // ---------------------------------------------------------------------------
  // Card API
  // ---------------------------------------------------------------------------

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this._config = this._parseConfig(config);
    this._tab = this._config.tabs.includes(this._config.default_tab)
      ? this._config.default_tab
      : this._config.tabs[0];
  }

  _parseConfig(config) {
    const tabs = (Array.isArray(config.tabs) && config.tabs.length ? config.tabs : DEFAULT_TABS)
      .map((t) => TAB_ALIASES[t] || t)
      .filter((t) => TAB_LABELS[t]);
    return {
      ...config,
      tabs: tabs.length ? tabs : DEFAULT_TABS,
      default_tab: TAB_ALIASES[config.default_tab] || config.default_tab || "now",
    };
  }

  getCardSize() {
    return 6;
  }

  static getStubConfig() {
    return {};
  }

  get title() {
    return this._config.title || this._data?.settings?.title || DEFAULT_TITLE;
  }

  get nowLimit() {
    const n = Number(this._config.now_limit) || Number(this._data?.settings?.now_limit);
    return n > 0 ? n : DEFAULT_NOW_LIMIT;
  }

  // ---------------------------------------------------------------------------
  // Lifecycle and data
  // ---------------------------------------------------------------------------

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("pagehide", this._onPageHide);
    window.addEventListener("keydown", this._onKeyDown);
    if (this.hass) this._subscribe();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("pagehide", this._onPageHide);
    window.removeEventListener("keydown", this._onKeyDown);
    this._flushPending();
    this._unsubscribeUpdates();
  }

  willUpdate(changed) {
    if (changed.has("hass") && this.hass) {
      this.toggleAttribute("dark", Boolean(this.hass.themes?.darkMode));
      if (this.isConnected) this._subscribe();
    }
  }

  async _subscribe() {
    if (!this.hass || this._unsubscribe || this._subscribing) return;
    this._subscribing = true;
    if (!this._data) this._loading = true;
    try {
      this._unsubscribe = await this.hass.connection.subscribeMessage(
        (data) => {
          this._data = data;
          this._loading = false;
          this._error = null;
        },
        { type: "vivino_cellar/subscribe" }
      );
      if (!this.isConnected) this._unsubscribeUpdates();
    } catch {
      await this._loadOnce(); // older backend without the subscribe command
    } finally {
      this._subscribing = false;
    }
  }

  _unsubscribeUpdates() {
    if (!this._unsubscribe) return;
    const unsub = this._unsubscribe;
    this._unsubscribe = null;
    Promise.resolve(unsub()).catch(() => {});
  }

  async _loadOnce() {
    if (!this.hass) return;
    this._loading = true;
    try {
      this._data = await this.hass.callWS({ type: "vivino_cellar/cellar" });
      this._error = null;
    } catch (err) {
      this._error = err?.message || "Fout bij ophalen van keldergegevens.";
    } finally {
      this._loading = false;
    }
  }

  async _refresh() {
    if (!this.hass || this._refreshing) return;
    this._refreshing = true;
    try {
      await this.hass.callWS({ type: "vivino_cellar/refresh" });
      if (!this._unsubscribe) this._data = await this.hass.callWS({ type: "vivino_cellar/cellar" });
      this._error = null;
    } catch (err) {
      this._error = err?.message || "Fout bij vernieuwen van kelder.";
    } finally {
      this._refreshing = false;
    }
  }

  /** Wines with bottles of pending (undoable) drinks hidden. */
  get _wines() {
    return viewWines(this._data?.wines, new Set(this._pending.keys()));
  }

  _wine(vid) {
    return this._wines.find((w) => vintageId(w) === vid) || null;
  }

  // ---------------------------------------------------------------------------
  // Drinking with undo
  // ---------------------------------------------------------------------------

  _drink(vid) {
    const wine = this._wine(vid);
    if (!wine || wine.bottles.length === 0) return;
    this._detailId = null;
    this._ratingDraft = null;
    if (bottleSpots(wine.bottles).length > 1) {
      this._pickerId = vid;
      return;
    }
    this._startDrink(wine, wine.bottles[0]);
  }

  _pickSpot(index) {
    const wine = this._wine(this._pickerId);
    this._pickerId = null;
    const spot = wine && bottleSpots(wine.bottles)[index];
    if (spot) this._startDrink(wine, spot.bottles[0]);
  }

  _startDrink(wine, bottle) {
    const id = bottleId(bottle);
    if (this._pending.has(id)) return;
    const name = wine.name || "Fles";
    this._pending.set(id, {
      timer: setTimeout(() => this._commitDrink(id), UNDO_MS),
      startedAt: Date.now(),
      vintageId: vintageId(wine),
      label: wine.year ? `${name} (${wine.year})` : name,
      committing: false,
    });
    this.requestUpdate();
  }

  _undo(id) {
    const pending = this._pending.get(id);
    if (!pending || pending.committing) return;
    clearTimeout(pending.timer);
    this._pending.delete(id);
    this.requestUpdate();
  }

  async _commitDrink(id) {
    const pending = this._pending.get(id);
    if (!pending || pending.committing || !this.hass) return;
    pending.committing = true;
    clearTimeout(pending.timer);
    this.requestUpdate();
    try {
      // The backend refreshes before replying, so the subscription already pushed new data.
      await this.hass.callWS({ type: "vivino_cellar/drink", bottle_id: id, vintage_id: pending.vintageId });
      this._pending.delete(id);
      if (!this._unsubscribe) await this._loadOnce();
    } catch (err) {
      this._pending.delete(id);
      this._showError(`Ontkurken van ${pending.label} mislukt: ${err?.message || err}`);
    }
    this.requestUpdate();
  }

  _flushPending() {
    for (const [id, pending] of this._pending) {
      if (!pending.committing) this._commitDrink(id);
    }
  }

  _showError(message) {
    const entry = { id: Date.now() + Math.random(), message };
    this._errors = [...this._errors, entry];
    setTimeout(() => this._dismissError(entry.id), ERROR_TOAST_MS);
  }

  _dismissError(id) {
    this._errors = this._errors.filter((e) => e.id !== id);
  }

  // ---------------------------------------------------------------------------
  // Detail sheet and rating
  // ---------------------------------------------------------------------------

  _openDetail(vid) {
    this._detailId = vid;
    this._loadRating(vid);
  }

  _closeModal() {
    if (this._pickerId !== null) {
      this._pickerId = null; // the picker opens from the sheet's flow: close it first
      return;
    }
    this._detailId = null;
    this._ratingDraft = null;
  }

  async _loadRating(vid) {
    const known = this._myRatings.get(vid);
    this._ratingDraft = {
      vid,
      rating: known?.rating ?? null,
      note: known?.note ?? "",
      status: this._myRatings.has(vid) ? "idle" : "loading",
      error: null,
    };
    if (this._myRatings.has(vid) || !this.hass) return;
    try {
      const res = await this.hass.callWS({ type: "vivino_cellar/rating", vintage_id: vid });
      const mine = res && res.rating !== null ? { rating: res.rating, note: res.note || "" } : null;
      this._myRatings.set(vid, mine);
      if (this._ratingDraft?.vid === vid && this._ratingDraft.status === "loading") {
        this._ratingDraft = { ...this._ratingDraft, rating: mine?.rating ?? null, note: mine?.note ?? "", status: "idle" };
      }
    } catch (err) {
      if (this._ratingDraft?.vid === vid) {
        this._ratingDraft = { ...this._ratingDraft, status: "error", error: err?.message || String(err) };
      }
    }
  }

  async _saveRating({ vintageId: vid, rating, note }) {
    if (!this.hass || this._ratingDraft?.status === "saving") return;
    this._ratingDraft = { vid, rating, note, status: "saving", error: null };
    try {
      const res = await this.hass.callWS({ type: "vivino_cellar/rate", vintage_id: vid, rating, note: note || "" });
      this._myRatings.set(vid, { rating: res.rating ?? rating, note: res.note ?? note });
      if (this._ratingDraft?.vid === vid) this._ratingDraft = { ...this._ratingDraft, status: "saved" };
    } catch (err) {
      if (this._ratingDraft?.vid === vid) {
        this._ratingDraft = { ...this._ratingDraft, status: "error", error: err?.message || String(err) };
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Pairing
  // ---------------------------------------------------------------------------

  async _pairingSearch({ dish, foodIds }) {
    if (!this.hass) return;
    const cleanDish = (dish || "").trim();
    const ids = [...(foodIds || [])];
    const state = { ...this._pairing, dish: cleanDish, foodIds: new Set(ids) };
    if (!cleanDish && ids.length === 0) {
      this._pairing = { ...state, results: null, error: "Voer een gerecht in of kies een categorie." };
      return;
    }
    this._pairing = { ...state, loading: true, error: null };
    try {
      const payload = cleanDish
        ? { type: "vivino_cellar/pairing", dish: cleanDish }
        : { type: "vivino_cellar/pairing", food_ids: ids };
      const res = await this.hass.callWS(payload);
      this._pairing = { ...this._pairing, loading: false, results: res.matches || res.pairings || [] };
    } catch (err) {
      this._pairing = { ...this._pairing, loading: false, results: null, error: err?.message || "Fout bij zoeken naar pairing." };
    }
  }

  // ---------------------------------------------------------------------------
  // Events from child elements
  // ---------------------------------------------------------------------------

  _listen() {
    const on = (type, fn) => this.addEventListener(type, (e) => fn(e.detail || {}));
    on("vc-drink", ({ vintageId: vid }) => this._drink(vid));
    on("vc-pick-spot", ({ index }) => this._pickSpot(index));
    on("vc-open", ({ vintageId: vid }) => this._openDetail(vid));
    on("vc-close", () => this._closeModal());
    on("vc-undo", ({ bottleId: id }) => this._undo(id));
    on("vc-dismiss-error", ({ id }) => this._dismissError(id));
    on("vc-rate", (detail) => this._saveRating(detail));
    on("vc-rating-draft", (draft) => {
      this._ratingDraft = { ...this._ratingDraft, ...draft, status: "idle", error: null };
    });
    on("vc-tab", ({ tab, statusFilter }) => {
      if (!this._config.tabs.includes(tab)) return;
      this._tab = tab;
      if (statusFilter !== undefined) this._statusFilter = statusFilter;
    });
    on("vc-chip", ({ chip }) => {
      this._chipTouched = true;
      this._chip = chip;
    });
    on("vc-filters", ({ filters, statusFilter, query }) => {
      if (filters) this._filters = filters;
      if (statusFilter !== undefined) this._statusFilter = statusFilter;
      if (query !== undefined) this._query = query;
    });
    on("vc-toggle-group", ({ status }) => {
      this._expanded = { ...this._expanded, [status]: !this._expanded[status] };
    });
    on("vc-pairing-search", (detail) => this._pairingSearch(detail));
    on("vc-pairing-reset", () => {
      this._pairing = { dish: "", foodIds: new Set(), results: null, loading: false, error: null };
    });
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  _lastRefresh() {
    const iso = this._data?.last_refresh_time;
    if (!iso) return "Nooit";
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
      ? iso
      : d.toLocaleDateString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  render() {
    const wines = this._wines;
    const total = wines.reduce((n, w) => n + w.bottles.length, 0);
    return html`
      <ha-card>
        <div class="card">
          <header class="hdr">
            <div class="logo"><ha-icon icon="mdi:barrel"></ha-icon></div>
            <div class="titles">
              <div class="title">${this.title}</div>
              <div class="muted sub">${total} flessen · bijgewerkt ${this._lastRefresh()}</div>
            </div>
            <button
              class="icon-btn ${this._refreshing ? "spinning" : ""}"
              title="Vernieuwen"
              aria-label="Vernieuwen"
              ?disabled=${this._refreshing}
              @click=${this._refresh}
            >
              <ha-icon icon="mdi:refresh"></ha-icon>
            </button>
          </header>

          ${this._data?.last_update_success === false
            ? html`<div class="banner warn">
                <ha-icon icon="mdi:alert"></ha-icon>
                Laatste update van Vivino mislukt. Gegevens kunnen verouderd zijn; controleer de Vivino-sessie.
              </div>`
            : nothing}
          ${this._error ? html`<div class="banner error"><ha-icon icon="mdi:alert-circle"></ha-icon>${this._error}</div>` : nothing}

          ${this._config.tabs.length > 1
            ? html`<nav class="tabs" role="tablist">
                ${this._config.tabs.map(
                  (t) => html`<button
                    role="tab"
                    class="tab"
                    aria-selected=${this._tab === t}
                    @click=${() => (this._tab = t)}
                  >
                    ${TAB_LABELS[t]}
                  </button>`
                )}
              </nav>`
            : nothing}

          ${this._loading && !this._data
            ? html`<div class="empty">Kelder laden…</div>`
            : this._renderTab(wines)}
        </div>
      </ha-card>
      ${this._renderModals(wines)}
      <vc-toast-stack .pending=${[...this._pending.entries()]} .errors=${this._errors} .undoMs=${UNDO_MS}></vc-toast-stack>
    `;
  }

  _renderTab(wines) {
    // Filled in by the tab elements (Tasks 6-8).
    return html`<div class="empty" data-tab=${this._tab} data-wines=${wines.length}>${TAB_LABELS[this._tab]}</div>`;
  }

  _renderModals() {
    // Detail sheet and spot picker (Task 5).
    return nothing;
  }

  static styles = [
    tokenStyles,
    themeStyles,
    css`
      :host { display: block; }
      ha-card { overflow: visible; }
      .card { padding: 16px; container-type: inline-size; }
      .hdr { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
      .logo {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--vc-accent);
        background: color-mix(in srgb, var(--vc-accent) var(--vc-tint), transparent);
        flex: none;
      }
      .titles { flex: 1; min-width: 0; }
      .title { font-size: 18px; font-weight: 600; line-height: 1.2; }
      .sub { font-size: 12.5px; }
      .spinning ha-icon { animation: spin 1s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
      .banner {
        display: flex;
        gap: 8px;
        align-items: flex-start;
        font-size: 13px;
        padding: 10px 12px;
        border-radius: var(--vc-radius-sm);
        margin-bottom: 12px;
      }
      .banner ha-icon { --mdc-icon-size: 18px; flex: none; }
      .banner.warn {
        color: var(--vc-status-near_past_peak);
        background: color-mix(in srgb, var(--vc-status-near_past_peak) var(--vc-tint), transparent);
      }
      .banner.error {
        color: var(--vc-status-past_peak);
        background: color-mix(in srgb, var(--vc-status-past_peak) var(--vc-tint), transparent);
      }
      .tabs {
        display: flex;
        gap: 2px;
        padding: 3px;
        margin-bottom: 12px;
        border-radius: 12px;
        background: var(--vc-surface-2);
      }
      .tab {
        flex: 1 1 0;
        min-width: 0;
        height: 34px;
        border: none;
        border-radius: 9px;
        background: transparent;
        color: var(--vc-muted);
        font-size: 13.5px;
        cursor: pointer;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .tab[aria-selected="true"] {
        background: var(--vc-surface);
        color: var(--vc-text);
        font-weight: 600;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
      }
      @container (max-width: 360px) {
        .card { padding: 12px; }
        .tab { font-size: 12.5px; }
      }
    `,
  ];
}

if (!customElements.get("vivino-cellar-card")) {
  customElements.define("vivino-cellar-card", VivinoCellarCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === "vivino-cellar-card")) {
  window.customCards.push({
    type: "vivino-cellar-card",
    name: "Vivino Cellar Card",
    description: "Vivino cellar: what to drink tonight, food pairing and the whole cellar",
    preview: false,
  });
}

export { STATUS_ORDER };
