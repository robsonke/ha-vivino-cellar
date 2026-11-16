/** "Which bottle are you taking?": pick a location when a wine sits in more than one spot. */
import { css, html, nothing } from "lit";

import { t } from "../logic/i18n.js";
import { bottleSpots, spotLabel } from "../logic/util.js";
import { themeStyles } from "../styles/theme.js";
import { fire } from "./events.js";
import { LanguageController } from "./language.js";
import { VcModal } from "./modal.js";

export class VcSpotPicker extends VcModal {
  static properties = { wine: { attribute: false } };

  constructor() {
    super();
    this._language = new LanguageController(this);
  }

  render() {
    const w = this.wine;
    if (!w) return nothing;
    return html`
      <dialog aria-label=${t("picker.title")} @cancel=${this._cancel} @close=${this._closed} @click=${this._backdrop}>
        <div class="sheet picker">
          <div class="head"><ha-icon icon="mdi:glass-wine"></ha-icon> ${t("picker.title")}</div>
          <div class="body">
            <div class="wine">${w.name || t("wine.fallback")}${w.year ? ` (${w.year})` : ""}</div>
            ${bottleSpots(w.bottles).map(
              (s, i) => html`
                <button class="spot" @click=${() => fire(this, "vc-pick-spot", { index: i })}>
                  <span><ha-icon icon="mdi:map-marker"></ha-icon> ${spotLabel(s)}</span>
                  <span class="count">${s.bottles.length}×</span>
                </button>
              `
            )}
          </div>
          <div class="foot">
            <button class="btn" @click=${() => fire(this, "vc-close")}>${t("common.cancel")}</button>
          </div>
        </div>
      </dialog>
    `;
  }

  static styles = [
    themeStyles,
    VcModal.modalStyles,
    css`
      .picker { max-width: 420px; }
      .head {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 16px;
        font-weight: 600;
        border-bottom: 1px solid var(--vc-divider);
      }
      .head ha-icon { color: var(--vc-accent); }
      .body { display: flex; flex-direction: column; gap: 8px; }
      .wine { font-weight: 500; margin-bottom: 4px; }
      .spot {
        display: flex;
        justify-content: space-between;
        align-items: center;
        min-height: var(--vc-control-height);
        padding: 8px 12px;
        border-radius: var(--vc-radius-sm);
        border: 1px solid var(--vc-divider);
        background: var(--vc-surface);
        cursor: pointer;
        text-align: left;
      }
      .spot:hover { border-color: var(--vc-accent); }
      .spot ha-icon { --mdc-icon-size: 16px; color: var(--vc-muted); }
      .count { font-weight: 600; }
    `,
  ];
}

if (!customElements.get("vc-spot-picker")) customElements.define("vc-spot-picker", VcSpotPicker);
