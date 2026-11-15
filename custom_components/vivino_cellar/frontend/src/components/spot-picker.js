/** "Welke fles pak je?" — pick a location when a wine sits in more than one spot. */
import { css, html, nothing } from "lit";

import { bottleSpots } from "../logic/util.js";
import { themeStyles } from "../styles/theme.js";
import { fire } from "./events.js";
import { VcModal } from "./modal.js";

export class VcSpotPicker extends VcModal {
  static properties = { wine: { attribute: false } };

  render() {
    const w = this.wine;
    if (!w) return nothing;
    return html`
      <dialog aria-label="Welke fles pak je?" @cancel=${this._cancel} @close=${this._closed} @click=${this._backdrop}>
        <div class="sheet picker">
          <div class="head"><ha-icon icon="mdi:glass-wine"></ha-icon> Welke fles pak je?</div>
          <div class="body">
            <div class="wine">${w.name || "Wijn"}${w.year ? ` (${w.year})` : ""}</div>
            ${bottleSpots(w.bottles).map(
              (s, i) => html`
                <button class="spot" @click=${() => fire(this, "vc-pick-spot", { index: i })}>
                  <span><ha-icon icon="mdi:map-marker"></ha-icon> ${s.location}${s.bin ? ` · vak ${s.bin}` : ""}</span>
                  <span class="count">${s.bottles.length}×</span>
                </button>
              `
            )}
          </div>
          <div class="foot">
            <button class="btn" @click=${() => fire(this, "vc-close")}>Annuleren</button>
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
