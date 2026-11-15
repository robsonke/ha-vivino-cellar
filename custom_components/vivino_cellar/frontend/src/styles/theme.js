/**
 * Shared look: everything follows the HA theme; only status colours are fixed.
 * Every element includes `themeStyles` in its static styles.
 */
import { css, unsafeCSS } from "lit";

import { STATUS_COLORS, TINT, TOAST_ERROR_BG } from "../logic/colors.js";

const statusVars = (theme) =>
  unsafeCSS(
    Object.entries(STATUS_COLORS[theme])
      .map(([status, color]) => `--vc-status-${status}: ${color};`)
      .join("\n")
  );

/** Tokens and status colours. Only the root card includes this; children inherit. */
export const tokenStyles = css`
  :host {
    --vc-gap: 12px;
    --vc-radius: var(--ha-card-border-radius, 12px);
    --vc-radius-sm: 8px;
    --vc-control-height: 40px;
    --vc-button-height: 36px;
    --vc-font: var(--ha-font-family-body, Roboto, system-ui, sans-serif);
    --vc-text: var(--primary-text-color, #212121);
    --vc-muted: var(--secondary-text-color, #727272);
    --vc-divider: var(--divider-color, rgba(0, 0, 0, 0.12));
    --vc-surface: var(--card-background-color, var(--ha-card-background, #fff));
    --vc-surface-2: var(--secondary-background-color, #f5f5f5);
    --vc-accent: var(--primary-color, #03a9f4);
    --vc-on-accent: var(--text-primary-color, #fff);
    --vc-tint: ${unsafeCSS(TINT.light * 100)}%;

    /* Status colours, light theme */
    ${statusVars("light")}
    --vc-toast-error: ${unsafeCSS(TOAST_ERROR_BG)};
    --vc-star: #f5a623;

  }

  /* Status colours, dark theme (set by the root from hass.themes.darkMode) */
  :host([dark]) {
    ${statusVars("dark")}
    --vc-tint: ${unsafeCSS(TINT.dark * 100)}%;
  }

`;

/** Shared classes for every element. */
export const themeStyles = css`
  :host {
    font-family: var(--vc-font, Roboto, sans-serif);
    color: var(--vc-text, inherit);
  }

  .s-near_past_peak { --vc-edge: var(--vc-status-near_past_peak); }
  .s-ready { --vc-edge: var(--vc-status-ready); }
  .s-can_wait { --vc-edge: var(--vc-status-can_wait); }
  .s-hold { --vc-edge: var(--vc-status-hold); }
  .s-past_peak { --vc-edge: var(--vc-status-past_peak); }
  .s-unknown { --vc-edge: var(--vc-status-unknown); }

  * { box-sizing: border-box; }

  button, input, select, textarea { font: inherit; color: inherit; }

  :focus-visible {
    outline: 2px solid var(--vc-accent);
    outline-offset: 2px;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: var(--vc-button-height);
    padding: 0 16px;
    border-radius: 999px;
    border: 1px solid var(--vc-divider);
    background: transparent;
    color: var(--vc-text);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
  }
  .btn[disabled] { opacity: 0.45; cursor: default; }
  .btn-primary { background: var(--vc-accent); border-color: var(--vc-accent); color: var(--vc-on-accent); }
  .btn-link { border: none; background: none; padding: 0; height: auto; color: var(--vc-accent); text-decoration: underline; }
  .btn ha-icon { --mdc-icon-size: 18px; }

  .icon-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: var(--vc-muted);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex: none;
  }
  .icon-btn:hover { background: var(--vc-surface-2); }

  .input, .select {
    height: var(--vc-control-height);
    width: 100%;
    min-width: 0;
    padding: 0 12px;
    border-radius: var(--vc-radius-sm);
    border: 1px solid var(--vc-divider);
    background: var(--vc-surface);
    color: var(--vc-text);
    font-size: 14px;
  }
  .select { cursor: pointer; }
  .select.active { border-color: var(--vc-accent); color: var(--vc-accent); }
  textarea.input { height: auto; padding: 10px 12px; resize: vertical; }

  .chip {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: var(--vc-button-height);
    padding: 0 14px;
    border-radius: 999px;
    border: 1px solid var(--vc-divider);
    background: var(--vc-surface);
    color: var(--vc-text);
    font-size: 13px;
    cursor: pointer;
    white-space: nowrap;
  }
  .chip[aria-pressed="true"] {
    border-color: var(--vc-accent);
    color: var(--vc-accent);
    background: color-mix(in srgb, var(--vc-accent) var(--vc-tint), transparent);
    font-weight: 600;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 999px;
    color: var(--vc-edge, var(--vc-muted));
    background: color-mix(in srgb, var(--vc-edge, var(--vc-muted)) var(--vc-tint), transparent);
  }
  .badge ha-icon { --mdc-icon-size: 14px; }

  .muted { color: var(--vc-muted); }
  .section-label {
    font-size: 11px;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--vc-muted);
    margin: 4px 4px 6px;
  }
  .empty { padding: 24px 8px; text-align: center; color: var(--vc-muted); }

  .bottle-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--vc-surface-2);
    color: var(--vc-muted);
    border-radius: var(--vc-radius-sm);
  }
`;
