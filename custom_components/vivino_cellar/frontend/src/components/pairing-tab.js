/**
 * Wijn & Spijs: dish search or food chips, results as compact rows.
 * Fires vc-pairing-search {dish, foodIds} and vc-pairing-reset.
 */
import { LitElement, css, html, nothing } from "lit";

import { STATUS_LABELS } from "../logic/status.js";
import { vintageId } from "../logic/util.js";
import { themeStyles } from "../styles/theme.js";
import { fire } from "./events.js";
import "./wine-row.js";

export class VcPairingTab extends LitElement {
  static properties = {
    wines: { attribute: false }, // cellar wines (pending drinks hidden)
    categories: { attribute: false },
    pairing: { attribute: false }, // {dish, foodIds:Set, results, loading, error}
    focusDish: { type: Boolean },
    _dish: { state: true },
  };

  willUpdate(changed) {
    if (changed.has("pairing") && this._dish === undefined) this._dish = this.pairing?.dish || "";
  }

  updated(changed) {
    if (changed.has("focusDish") && this.focusDish) this.renderRoot.querySelector("#dish")?.focus();
  }

  _search() {
    fire(this, "vc-pairing-search", { dish: this._dish || "", foodIds: [] });
  }

  _toggleFood(id) {
    const ids = new Set(this.pairing?.foodIds || []);
    if (ids.has(id)) ids.delete(id);
    else ids.add(id);
    this._dish = ""; // dish and food chips are separate searches
    if (ids.size) fire(this, "vc-pairing-search", { dish: "", foodIds: [...ids] });
    else fire(this, "vc-pairing-reset");
  }

  _reset() {
    this._dish = "";
    fire(this, "vc-pairing-reset");
  }

  _results() {
    const p = this.pairing || {};
    if (p.loading) return html`<div class="empty">Zoeken…</div>`;
    if (p.error) return html`<div class="error">${p.error}</div>`;
    if (!p.results) return nothing;
    if (!p.results.length) return html`<div class="empty">Geen passende wijn in je kelder.</div>`;
    const byId = new Map((this.wines || []).map((w) => [vintageId(w), w]));
    return html`
      <div class="section-label">Past erbij</div>
      <div class="list">
        ${p.results.map((match) => {
          const wine = { ...match, ...(byId.get(vintageId(match)) || {}) };
          if (!(wine.bottles || []).length) return nothing;
          const status = wine.window_status || "unknown";
          const when = [STATUS_LABELS[status], wine.end_year ? `tot ${wine.end_year}` : ""].filter(Boolean).join(" · ");
          return html`<vc-wine-row .wine=${wine} .lines=${[match.explanation, when]}></vc-wine-row>`;
        })}
      </div>
    `;
  }

  render() {
    const p = this.pairing || {};
    const selected = p.foodIds || new Set();
    const categories = this.categories || [];
    return html`
      <div class="search">
        <input
          id="dish"
          class="input"
          type="search"
          placeholder="Wat eet je? Bijv. pasta met truffel"
          .value=${this._dish ?? ""}
          @input=${(e) => (this._dish = e.target.value)}
          @keydown=${(e) => e.key === "Enter" && this._search()}
        />
        <button class="btn btn-primary" ?disabled=${!(this._dish || "").trim()} @click=${this._search}>
          Zoek
        </button>
      </div>

      ${categories.length
        ? html`<div class="foods" role="group" aria-label="Of kies een categorie">
            ${categories.map(
              (c) => html`<button class="chip" aria-pressed=${selected.has(c.id)} @click=${() => this._toggleFood(c.id)}>
                ${c.name}
              </button>`
            )}
          </div>`
        : nothing}

      ${p.results || p.error || (this._dish || "") || selected.size
        ? html`<button class="btn btn-link reset" @click=${this._reset}>Opnieuw</button>`
        : nothing}

      ${this._results()}
    `;
  }

  static styles = [
    themeStyles,
    css`
      :host { display: flex; flex-direction: column; gap: 12px; }
      .search { display: flex; gap: 8px; }
      .search .input { flex: 1; -webkit-appearance: none; }
      .foods { display: flex; flex-wrap: wrap; gap: 6px; }
      .reset { align-self: flex-start; font-size: 13px; }
      .list { display: flex; flex-direction: column; gap: 8px; }
      .error {
        color: var(--vc-status-past_peak);
        background: color-mix(in srgb, var(--vc-status-past_peak) var(--vc-tint), transparent);
        padding: 10px 12px;
        border-radius: var(--vc-radius-sm);
        font-size: 13px;
      }
    `,
  ];
}

if (!customElements.get("vc-pairing-tab")) customElements.define("vc-pairing-tab", VcPairingTab);
