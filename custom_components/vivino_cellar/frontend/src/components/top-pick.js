/** The one wine to open tonight: big photo, reason line, primary uncork button. */
import { LitElement, css, html, nothing } from "lit";

import { t } from "../logic/i18n.js";
import { styleLine } from "../logic/ranking.js";
import { reasonLine } from "../logic/status.js";
import { safeUrl, vintageId } from "../logic/util.js";
import { themeStyles } from "../styles/theme.js";
import { fire } from "./events.js";
import { LanguageController } from "./language.js";

export class VcTopPick extends LitElement {
  static properties = { wine: { attribute: false } };

  constructor() {
    super();
    this._language = new LanguageController(this);
  }

  _open() {
    fire(this, "vc-open", { vintageId: vintageId(this.wine) });
  }

  render() {
    const w = this.wine;
    if (!w) return nothing;
    const name = w.name || t("wine.unknown");
    const image = safeUrl(w.image_url);
    const sub = [styleLine(w), w.winery, w.region].filter(Boolean).join(" · ");
    return html`
      <div
        class="pick s-${w.window_status || "unknown"}"
        role="button"
        tabindex="0"
        aria-label=${t("wine.details", { name })}
        @click=${this._open}
        @keydown=${(e) => {
          if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            this._open();
          }
        }}
      >
        ${image
          ? html`<img class="photo" src=${image} alt="" @error=${(e) => (e.target.style.visibility = "hidden")} />`
          : html`<div class="photo bottle-placeholder"><ha-icon icon="mdi:bottle-wine"></ha-icon></div>`}
        <div class="text">
          <div class="name">${name}${w.year ? html` <span class="year">${w.year}</span>` : nothing}</div>
          ${sub ? html`<div class="muted sub">${sub}</div>` : nothing}
          <div class="reason">${reasonLine(w, new Date().getFullYear())}</div>
          <button
            class="btn btn-primary"
            @click=${(e) => {
              e.stopPropagation();
              fire(this, "vc-drink", { vintageId: vintageId(w) });
            }}
          >
            <ha-icon icon="mdi:glass-wine"></ha-icon> ${t("common.uncork")}
          </button>
        </div>
      </div>
    `;
  }

  static styles = [
    themeStyles,
    css`
      :host { display: block; }
      .pick {
        display: flex;
        gap: 14px;
        padding: 14px;
        border-radius: var(--vc-radius);
        background: var(--vc-surface-2);
        border-left: 4px solid var(--vc-edge);
        cursor: pointer;
      }
      .photo { width: 60px; height: 104px; flex: none; object-fit: contain; border-radius: var(--vc-radius-sm); }
      .photo.bottle-placeholder { background: var(--vc-surface); }
      .text { min-width: 0; display: flex; flex-direction: column; align-items: flex-start; gap: 3px; }
      .name { font-size: 17px; font-weight: 600; line-height: 1.25; }
      .year { font-weight: 400; color: var(--vc-muted); }
      .sub { font-size: 13px; }
      .reason { font-size: 13.5px; font-weight: 500; color: var(--vc-edge); margin: 4px 0 8px; }
    `,
  ];
}

if (!customElements.get("vc-top-pick")) customElements.define("vc-top-pick", VcTopPick);
