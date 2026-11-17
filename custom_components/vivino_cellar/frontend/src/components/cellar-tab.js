/**
 * Cellar tab: every wine with search, status pills, filters and sorting.
 * Fires vc-filters {filters?, statusFilter?, query?} and vc-toggle-group {status}.
 */
import { LitElement, css, html, nothing } from "lit";

import {
  EMPTY_FILTERS,
  filterOptions,
  matchesFilters,
  sortWines,
  statusCounts,
} from "../logic/filters.js";
import { t } from "../logic/i18n.js";
import { STATUS_LABELS, STATUS_ORDER, wineTypeName } from "../logic/status.js";
import { cellarLines } from "../logic/cellar-lines.js";
import { vintageId } from "../logic/util.js";
import { themeStyles } from "../styles/theme.js";
import { fire } from "./events.js";
import { LanguageController } from "./language.js";
import "./wine-row.js";

const SORTS = ["status", "drink_by", "rating", "vintage", "bottles", "name"];
const MIN_BOTTLES = [0, 2, 3, 6];

export class VcCellarTab extends LitElement {
  static properties = {
    wines: { attribute: false },
    filters: { attribute: false },
    statusFilter: { type: String },
    query: { type: String },
    expanded: { attribute: false },
  };

  constructor() {
    super();
    this.filters = { ...EMPTY_FILTERS };
    this.expanded = {};
    this.query = "";
    this._language = new LanguageController(this);
  }

  get _ctx() {
    return { filters: this.filters, statusFilter: this.statusFilter || null, query: this.query || "" };
  }

  _set(key, value) {
    const filters = { ...this.filters, [key]: key === "minBottles" ? Number(value) : value };
    if (key === "country") filters.region = ""; // a region belongs to one country
    fire(this, "vc-filters", { filters });
  }

  _active() {
    const f = this.filters;
    return Boolean(this.statusFilter || this.query || f.type || f.country || f.region || f.grape || f.minBottles);
  }

  _select(key, allLabel, options) {
    const current = this.filters[key];
    return html`
      <select class="select ${current ? "active" : ""}" aria-label=${allLabel} @change=${(e) => this._set(key, e.target.value)}>
        <option value="" ?selected=${!current}>${allLabel}</option>
        ${options.map((o) => html`<option value=${o.value} ?selected=${o.value === current}>${o.label} (${o.n})</option>`)}
      </select>
    `;
  }

  _row(w) {
    return html`<vc-wine-row .wine=${w} .lines=${cellarLines(w)} data-id=${vintageId(w)}></vc-wine-row>`;
  }

  render() {
    const all = this.wines || [];
    const ctx = this._ctx;
    const f = this.filters;
    const wines = all.filter((w) => matchesFilters(w, f, ctx.statusFilter, ctx.query));
    const bottles = wines.reduce((n, w) => n + w.bottles.length, 0);
    const counts = statusCounts(all, ctx);

    const typeOpts = filterOptions(all, "type", (w) => [w.type_id], wineTypeName, ctx);
    const countryOpts = filterOptions(all, "country", (w) => [w.country], (v) => v, ctx, ["region"]);
    const regionOpts = filterOptions(all, "region", (w) => [w.region], (v) => v, ctx);
    const grapeOpts = filterOptions(all, "grape", (w) => w.grapes || [], (v) => v, ctx);

    let list;
    if (f.sort === "status") {
      list = STATUS_ORDER.map((status) => {
        if (ctx.statusFilter && status !== ctx.statusFilter) return nothing;
        const group = sortWines(wines.filter((w) => (w.window_status || "unknown") === status), "drink_by");
        if (!group.length) return nothing;
        const open = ctx.statusFilter === status || Boolean(this.expanded[status]);
        const n = group.reduce((s, w) => s + w.bottles.length, 0);
        return html`
          <section class="group s-${status}">
            <button class="group-head" aria-expanded=${open} @click=${() => fire(this, "vc-toggle-group", { status })}>
              <span class="badge">${STATUS_LABELS[status]}</span>
              <span class="muted">${t("common.bottles", { count: n })}</span>
              <ha-icon class="chev" icon="mdi:chevron-down"></ha-icon>
            </button>
            ${open ? html`<div class="list">${group.map((w) => this._row(w))}</div>` : nothing}
          </section>
        `;
      });
    } else {
      list = html`<div class="list">${sortWines(wines, f.sort).map((w) => this._row(w))}</div>`;
    }

    return html`
      <input
        class="input search"
        type="search"
        placeholder=${t("cellar.search_placeholder")}
        .value=${this.query || ""}
        @input=${(e) => fire(this, "vc-filters", { query: e.target.value })}
      />

      <div class="pills ${ctx.statusFilter ? "filtering" : ""}">
        ${STATUS_ORDER.map((status) => {
          const active = ctx.statusFilter === status;
          const n = counts[status] || 0;
          return html`<button
            class="pill s-${status} ${active ? "active" : ""}"
            aria-pressed=${active}
            ?disabled=${n === 0 && !active}
            @click=${() => fire(this, "vc-filters", { statusFilter: active ? null : status })}
          >
            ${STATUS_LABELS[status]}: ${n}
          </button>`;
        })}
      </div>

      <div class="selects">
        ${this._select("type", t("cellar.filter.all_types"), typeOpts)}
        ${this._select("country", t("cellar.filter.all_countries"), countryOpts)}
        ${this._select("region", t("cellar.filter.all_regions"), regionOpts)}
        ${this._select("grape", t("cellar.filter.all_grapes"), grapeOpts)}
        <select
          class="select ${f.minBottles ? "active" : ""}"
          aria-label=${t("cellar.filter.bottle_count")}
          @change=${(e) => this._set("minBottles", e.target.value)}
        >
          ${MIN_BOTTLES.map(
            (n) => html`<option value=${n} ?selected=${n === f.minBottles}>
              ${n ? t("cellar.filter.min_bottles", { n }) : t("cellar.filter.any_count")}
            </option>`
          )}
        </select>
        <select class="select sort" aria-label=${t("cellar.sort.label")} @change=${(e) => this._set("sort", e.target.value)}>
          ${SORTS.map(
            (k) => html`<option value=${k} ?selected=${k === f.sort}>
              ${t("cellar.sort.option", { label: t(`cellar.sort.${k}`) })}
            </option>`
          )}
        </select>
      </div>

      <div class="result">
        <span>${t("common.wines", { count: wines.length })} · ${t("common.bottles", { count: bottles })}</span>
        ${this._active()
          ? html`<button
              class="btn btn-link"
              @click=${() =>
                fire(this, "vc-filters", { filters: { ...EMPTY_FILTERS, sort: f.sort }, statusFilter: null, query: "" })}
            >
              ${t("cellar.clear_filters")}
            </button>`
          : nothing}
      </div>

      ${wines.length ? list : html`<div class="empty">${t("cellar.no_results")}</div>`}
    `;
  }

  static styles = [
    themeStyles,
    css`
      :host { display: flex; flex-direction: column; gap: 12px; }
      .search { -webkit-appearance: none; }
      .pills { display: flex; flex-wrap: wrap; gap: 6px; }
      .pill {
        height: 30px;
        padding: 0 12px;
        border-radius: 999px;
        border: 1.5px solid transparent;
        font-size: 13px;
        cursor: pointer;
        color: var(--vc-edge);
        background: color-mix(in srgb, var(--vc-edge) var(--vc-tint), transparent);
        transition: opacity 0.15s ease;
      }
      .pill.active { border-color: var(--vc-edge); font-weight: 600; }
      .pill[disabled] { opacity: 0.4; cursor: default; }
      .pills.filtering .pill:not(.active) { opacity: 0.45; }
      .selects {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 8px;
      }
      .selects .sort { grid-column: 1 / -1; }
      .result {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 13px;
        color: var(--vc-muted);
      }
      .list { display: flex; flex-direction: column; gap: 8px; }
      .group { display: flex; flex-direction: column; gap: 8px; }
      .group-head {
        display: flex;
        align-items: center;
        gap: 10px;
        height: var(--vc-control-height);
        padding: 0 8px;
        border: none;
        border-radius: var(--vc-radius-sm);
        background: var(--vc-surface-2);
        cursor: pointer;
        font-size: 13px;
      }
      .group-head .chev { margin-left: auto; --mdc-icon-size: 20px; color: var(--vc-muted); transition: transform 0.2s; }
      .group-head[aria-expanded="true"] .chev { transform: rotate(180deg); }
    `,
  ];
}

if (!customElements.get("vc-cellar-tab")) customElements.define("vc-cellar-tab", VcCellarTab);
