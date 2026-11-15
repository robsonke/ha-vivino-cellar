/**
 * Base for modal sheets: a native <dialog> opened with showModal(), so it sits
 * in the browser's top layer (a transformed parent like a Bubble Card popup
 * cannot push it off screen). Esc and backdrop clicks report vc-close.
 */
import { LitElement, css } from "lit";

import { fire } from "./events.js";

export class VcModal extends LitElement {
  updated() {
    const dialog = this.renderRoot.querySelector("dialog");
    if (!dialog || dialog.open) return;
    if (this._shown) {
      // The browser closed it (Android back, non-cancelable cancel): report, don't reopen.
      fire(this, "vc-close");
      return;
    }
    this._shown = true;
    try {
      dialog.showModal();
      dialog.querySelector("[autofocus]")?.focus();
    } catch {
      dialog.setAttribute("open", ""); // not connected yet: show inline
    }
  }

  /**
   * Esc, Android back, or the browser closing the dialog itself: tell the
   * root, so its state matches and the next render does not reopen it.
   */
  _cancel(e) {
    e.preventDefault();
    fire(this, "vc-close");
  }

  _closed() {
    fire(this, "vc-close");
  }

  _backdrop(e) {
    if (e.target === e.currentTarget) fire(this, "vc-close");
  }

  static modalStyles = css`
    dialog {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      max-width: none;
      max-height: none;
      margin: 0;
      padding: 16px;
      border: none;
      background: transparent;
      color: inherit;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    dialog:not([open]) { display: none; }
    dialog::backdrop { background: rgba(0, 0, 0, 0.5); }
    .sheet {
      width: 100%;
      max-width: 520px;
      max-height: calc(100vh - 32px);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border-radius: 16px;
      background: var(--vc-surface);
      color: var(--vc-text);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
    }
    .body { overflow-y: auto; padding: 16px; }
    .foot {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      padding: 12px 16px;
      border-top: 1px solid var(--vc-divider);
      background: var(--vc-surface-2);
    }
  `;
}
