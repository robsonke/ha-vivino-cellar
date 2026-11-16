/** Mood chips: single select, tap the active one to clear. The food chip opens the pairing tab. */
import { LitElement, css, html } from "lit";

import { t } from "../logic/i18n.js";
import { CHIPS } from "../logic/ranking.js";
import { themeStyles } from "../styles/theme.js";
import { fire } from "./events.js";
import { LanguageController } from "./language.js";

export class VcMoodChips extends LitElement {
  static properties = {
    chip: { type: String },
    showEatChip: { type: Boolean },
  };

  constructor() {
    super();
    this._language = new LanguageController(this);
  }

  _pick(id) {
    if (id === "with_food") {
      fire(this, "vc-tab", { tab: "pairing", focusDish: true });
      return;
    }
    fire(this, "vc-chip", { chip: this.chip === id ? null : id });
  }

  render() {
    const chips = CHIPS.filter((c) => c.id !== "with_food" || this.showEatChip);
    return html`
      <div class="chips" role="group" aria-label=${t("chip.label")}>
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
