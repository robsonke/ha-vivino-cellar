/** Mood chips: single select, tap the active one to clear. Bij het eten opens Wijn & Spijs. */
import { LitElement, css, html } from "lit";

import { CHIPS } from "../logic/ranking.js";
import { themeStyles } from "../styles/theme.js";
import { fire } from "./events.js";

export class VcMoodChips extends LitElement {
  static properties = {
    chip: { type: String },
    showEatChip: { type: Boolean },
  };

  _pick(id) {
    if (id === "eten") {
      fire(this, "vc-tab", { tab: "pairing", focusDish: true });
      return;
    }
    fire(this, "vc-chip", { chip: this.chip === id ? null : id });
  }

  render() {
    const chips = CHIPS.filter((c) => c.id !== "eten" || this.showEatChip);
    return html`
      <div class="chips" role="group" aria-label="Waar heb je zin in?">
        ${chips.map(
          (c) => html`<button class="chip" aria-pressed=${this.chip === c.id} @click=${() => this._pick(c.id)}>
            ${c.label}
          </button>`
        )}
      </div>
    `;
  }

  static styles = [
    themeStyles,
    css`
      :host { display: block; }
      .chips {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        scrollbar-width: none;
        padding: 2px 0 4px;
        margin: 0 -2px;
      }
      .chips::-webkit-scrollbar { display: none; }
    `,
  ];
}

if (!customElements.get("vc-mood-chips")) customElements.define("vc-mood-chips", VcMoodChips);
