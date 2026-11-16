/** Drink now tab: weather hint, mood chips, top pick, "also good tonight", past-peak hint. */
import { LitElement, css, html, nothing } from "lit";

import { t } from "../logic/i18n.js";
import { hintLine, rankTonight } from "../logic/ranking.js";
import { vintageId } from "../logic/util.js";
import { themeStyles } from "../styles/theme.js";
import { fire } from "./events.js";
import { LanguageController } from "./language.js";
import "./mood-chips.js";
import "./top-pick.js";
import "./wine-row.js";

export class VcNowTab extends LitElement {
  static properties = {
    wines: { attribute: false },
    chip: { type: String },
    limit: { type: Number },
    hint: { attribute: false }, // {chip, text} | null
    showEatChip: { type: Boolean },
    pastPeakCount: { type: Number },
  };

  constructor() {
    super();
    this._language = new LanguageController(this);
  }

  render() {
    const year = new Date().getFullYear();
    const ranked = rankTonight(this.wines || [], this.chip === "with_food" ? null : this.chip);
    const [top, ...rest] = ranked;
    const more = rest.slice(0, Math.max(0, (this.limit || 5) - 1));

    return html`
      ${this.hint
        ? html`<button
            class="hint ${this.hint.chip === "winter_evening" ? "cold" : "warm"}"
            @click=${() => this.chip !== this.hint.chip && fire(this, "vc-chip", { chip: this.hint.chip })}
          >
            ${this.hint.text}
          </button>`
        : nothing}
      <vc-mood-chips .chip=${this.chip} ?showEatChip=${this.showEatChip}></vc-mood-chips>

      ${top
        ? html`
            <vc-top-pick .wine=${top}></vc-top-pick>
            ${more.length
              ? html`<div class="section-label">${t("now.also_good")}</div>
                  <div class="list">
                    ${more.map(
                      (w) => html`<vc-wine-row .wine=${w} .lines=${[hintLine(w, this.chip, year)]} data-id=${vintageId(w)}></vc-wine-row>`
                    )}
                  </div>`
              : nothing}
          `
        : html`<div class="empty">
            ${this.chip
              ? html`${t("now.nothing_for_choice")}
                  <button class="btn-link btn" @click=${() => fire(this, "vc-chip", { chip: null })}>
                    ${t("now.show_all")}
                  </button>`
              : t("now.nothing_ready")}
          </div>`}

      ${this.pastPeakCount && this.chip !== "drink_up"
        ? html`<button class="past" @click=${() => fire(this, "vc-tab", { tab: "cellar", statusFilter: "past_peak" })}>
            <ha-icon icon="mdi:alert"></ha-icon>
            ${t("now.past_peak", { count: this.pastPeakCount })}
          </button>`
        : nothing}
    `;
  }

  static styles = [
    themeStyles,
    css`
      :host { display: flex; flex-direction: column; gap: 12px; }
      .hint {
        text-align: left;
        border: none;
        cursor: pointer;
        font-size: 14px;
        padding: 10px 12px;
        border-radius: var(--vc-radius-sm);
      }
      .hint.warm {
        color: var(--vc-status-near_past_peak);
        background: color-mix(in srgb, var(--vc-status-near_past_peak) var(--vc-tint), transparent);
      }
      .hint.cold {
        color: var(--vc-status-hold);
        background: color-mix(in srgb, var(--vc-status-hold) var(--vc-tint), transparent);
      }
      .list { display: flex; flex-direction: column; gap: 8px; }
      .section-label { margin-bottom: -4px; }
      .past {
        display: flex;
        align-items: center;
        gap: 6px;
        border: none;
        background: none;
        padding: 4px 2px;
        color: var(--vc-status-past_peak);
        font-size: 13.5px;
        cursor: pointer;
        text-align: left;
      }
      .past ha-icon { --mdc-icon-size: 16px; }
    `,
  ];
}

if (!customElements.get("vc-now-tab")) customElements.define("vc-now-tab", VcNowTab);
