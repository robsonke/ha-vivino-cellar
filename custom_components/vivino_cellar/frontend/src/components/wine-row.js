/**
 * Compact wine row: photo, name + year, one or two info lines, glass button.
 * Row click / Enter / Space -> vc-open; glass button -> vc-drink.
 */
import { LitElement, css, html, nothing } from "lit";

import { safeUrl, vintageId } from "../logic/util.js";
import { themeStyles } from "../styles/theme.js";
import { fire } from "./events.js";

export class VcWineRow extends LitElement {
  static properties = {
    wine: { attribute: false },
    lines: { attribute: false }, // [string, string?]
  };

  constructor() {
    super();
    this.lines = [];
  }

  _open() {
    fire(this, "vc-open", { vintageId: vintageId(this.wine) });
  }

  _key(e) {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this._open();
    }
  }

  _drink(e) {
    e.stopPropagation();
    fire(this, "vc-drink", { vintageId: vintageId(this.wine) });
  }

  render() {
    const w = this.wine;
    if (!w) return nothing;
    const name = w.name || "Onbekende wijn";
    const image = safeUrl(w.image_url);
    const status = w.window_status || "unknown";
    return html`
      <div
        class="row s-${status}"
        role="button"
        tabindex="0"
        aria-label="Details: ${name}"
        @click=${this._open}
        @keydown=${this._key}
      >
        ${image
          ? html`<img class="thumb" src=${image} alt="" loading="lazy" @error=${(e) => (e.target.style.visibility = "hidden")} />`
          : html`<div class="thumb bottle-placeholder"><ha-icon icon="mdi:bottle-wine"></ha-icon></div>`}
        <div class="text">
          <div class="name">${name}${w.year ? html` <span class="year">${w.year}</span>` : nothing}</div>
          ${(this.lines || []).filter(Boolean).map((l) => html`<div class="line">${l}</div>`)}
        </div>
        <button
          class="icon-btn glass"
          title="Ontkurken"
          aria-label="Ontkurken: ${name}"
          ?disabled=${!(w.bottles || []).length}
          @click=${this._drink}
        >
          <ha-icon icon="mdi:glass-wine"></ha-icon>
        </button>
      </div>
    `;
  }

  static styles = [
    themeStyles,
    css`
      :host { display: block; }
      .row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 6px 8px 10px;
        border-radius: var(--vc-radius-sm);
        border: 1px solid var(--vc-divider);
        border-left: 4px solid var(--vc-edge);
        background: var(--vc-surface);
        cursor: pointer;
      }
      .row:hover { background: color-mix(in srgb, var(--vc-surface-2) 60%, var(--vc-surface)); }
      .thumb {
        width: 32px;
        height: 54px;
        flex: none;
        object-fit: contain;
        border-radius: 6px;
      }
      .thumb.bottle-placeholder ha-icon { --mdc-icon-size: 18px; }
      .text { flex: 1; min-width: 0; }
      .name {
        font-size: 14.5px;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .year { font-weight: 400; color: var(--vc-muted); }
      .line {
        font-size: 12.5px;
        color: var(--vc-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .glass { color: var(--vc-accent); border: 1px solid var(--vc-divider); }
      .glass[disabled] { opacity: 0.35; cursor: default; }
    `,
  ];
}

if (!customElements.get("vc-wine-row")) customElements.define("vc-wine-row", VcWineRow);
