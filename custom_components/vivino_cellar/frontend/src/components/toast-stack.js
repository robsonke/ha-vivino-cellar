/** Undo toasts for pending drinks and error toasts. Fires vc-undo, vc-dismiss-error. */
import { LitElement, css, html } from "lit";

import { t } from "../logic/i18n.js";
import { themeStyles } from "../styles/theme.js";
import { fire } from "./events.js";
import { LanguageController } from "./language.js";

export class VcToastStack extends LitElement {
  static properties = {
    pending: { attribute: false }, // [[bottleId, {label, startedAt, committing}]]
    errors: { attribute: false }, // [{id, message}]
    undoMs: { type: Number },
  };

  constructor() {
    super();
    this.pending = [];
    this.errors = [];
    this.undoMs = 8000;
    this._language = new LanguageController(this);
  }

  render() {
    const undoable = this.pending.filter(([, p]) => !p.committing);
    if (!undoable.length && !this.errors.length) return html``;
    const now = Date.now();
    return html`
      <div class="stack" role="status" aria-live="polite">
        ${this.errors.map(
          (e) => html`
            <div class="toast error">
              <ha-icon icon="mdi:alert"></ha-icon>
              <span class="text">${e.message}</span>
              <button class="action" @click=${() => fire(this, "vc-dismiss-error", { id: e.id })}>
                ${t("common.close")}
              </button>
            </div>
          `
        )}
        ${undoable.map(
          ([id, p]) => html`
            <div class="toast">
              <ha-icon icon="mdi:glass-wine"></ha-icon>
              <span class="text">${t("toast.uncorked", { label: p.label })}</span>
              <button class="action" @click=${() => fire(this, "vc-undo", { bottleId: id })}>
                ${t("toast.undo")}
              </button>
              <div
                class="progress"
                style="animation-duration:${this.undoMs}ms;animation-delay:-${Math.min(
                  now - p.startedAt,
                  this.undoMs
                )}ms"
              ></div>
            </div>
          `
        )}
      </div>
    `;
  }

  static styles = [
    themeStyles,
    css`
      .stack {
        position: fixed;
        left: 50%;
        bottom: 16px;
        transform: translateX(-50%);
        width: min(440px, calc(100vw - 32px));
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 10;
      }
      .toast {
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: var(--vc-radius-sm);
        background: var(--vc-text);
        color: var(--vc-surface);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        font-size: 14px;
      }
      .toast.error { background: var(--vc-toast-error); color: #fff; }
      .text { flex: 1; min-width: 0; }
      .action {
        border: none;
        background: none;
        color: inherit;
        font-weight: 600;
        cursor: pointer;
        padding: 6px;
        text-decoration: underline;
      }
      .progress {
        position: absolute;
        left: 0;
        bottom: 0;
        height: 3px;
        width: 100%;
        background: var(--vc-accent);
        transform-origin: left;
        animation-name: shrink;
        animation-timing-function: linear;
        animation-fill-mode: forwards;
      }
      @keyframes shrink { from { transform: scaleX(1); } to { transform: scaleX(0); } }
    `,
  ];
}

if (!customElements.get("vc-toast-stack")) customElements.define("vc-toast-stack", VcToastStack);
