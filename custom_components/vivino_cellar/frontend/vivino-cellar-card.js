/**
 * Vivino Cellar Custom Lovelace Card and Sidebar Panel Component.
 */

/**
 * Styles for the Vivino Cellar Lovelace Card & Sidebar Panel.
 */

export const cardStyles = `
  :host {
    display: block;
    font-family: var(--paper-font-body1_-_font-family, Roboto, sans-serif);
    -webkit-font-smoothing: antialiased;
    color: var(--primary-text-color, #212121);
    box-sizing: border-box;
  }

  *, *:before, *:after {
    box-sizing: inherit;
  }

  .card-container {
    container-type: inline-size;
    background: var(--ha-card-background, var(--card-background-color, #ffffff));
    border-radius: var(--ha-card-border-radius, 12px);
    box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0, 0, 0, 0.1));
    border: var(--ha-card-border-width, 1px) solid var(--ha-card-border-color, var(--divider-color, #e0e0e0));
    padding: 16px;
    position: relative;
    overflow: hidden;
  }

  /* Header */
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--divider-color, #eee);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .header-icon {
    width: 32px;
    height: 32px;
    color: var(--primary-color, #8b1e3f);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .header-icon svg {
    width: 28px;
    height: 28px;
    fill: currentColor;
  }

  .header-titles {
    display: flex;
    flex-direction: column;
  }

  .header-title {
    font-size: 1.25rem;
    font-weight: 600;
    line-height: 1.3;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .bottle-badge {
    font-size: 0.75rem;
    font-weight: 500;
    background: var(--primary-color, #8b1e3f);
    color: #fff;
    padding: 2px 8px;
    border-radius: 12px;
  }

  .header-subtitle {
    font-size: 0.8rem;
    color: var(--secondary-text-color, #757575);
    margin-top: 2px;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .icon-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 6px;
    border-radius: 50%;
    color: var(--secondary-text-color, #757575);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s, color 0.2s;
  }

  .icon-button:hover {
    background: var(--secondary-background-color, rgba(0, 0, 0, 0.05));
    color: var(--primary-text-color, #212121);
  }

  .icon-button svg {
    width: 20px;
    height: 20px;
    fill: currentColor;
  }

  .icon-button.spinning svg {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    100% { transform: rotate(360deg); }
  }

  /* Error Banner */
  .error-banner {
    background-color: var(--error-color, #db4437);
    color: white;
    padding: 10px 14px;
    border-radius: 8px;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
  }

  .error-banner svg {
    width: 20px;
    height: 20px;
    fill: white;
    flex-shrink: 0;
  }

  /* Tabs Bar */
  .tabs-bar {
    display: flex;
    background: var(--secondary-background-color, #f5f5f5);
    border-radius: 8px;
    padding: 3px;
    margin-bottom: 16px;
    gap: 4px;
  }

  .tab-btn {
    flex: 1 1 0;
    min-width: 0;
    white-space: nowrap;
    border: none;
    background: transparent;
    padding: 8px 12px;
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--secondary-text-color, #666);
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .tab-btn svg {
    width: 16px;
    height: 16px;
    fill: currentColor;
  }

  .tab-btn.active {
    background: var(--ha-card-background, var(--card-background-color, #ffffff));
    color: var(--primary-color, #8b1e3f);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    font-weight: 600;
  }

  /* Pairing Tab */
  .pairing-controls {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
  }

  .search-input-row {
    display: flex;
    gap: 8px;
  }

  .text-input {
    flex: 1;
    padding: 10px 14px;
    border: 1px solid var(--divider-color, #ccc);
    border-radius: 8px;
    font-size: 0.95rem;
    background: var(--input-fill-color, var(--ha-card-background, #fff));
    color: var(--primary-text-color, #212121);
    outline: none;
    transition: border-color 0.2s;
  }

  .text-input:focus {
    border-color: var(--primary-color, #8b1e3f);
  }

  .primary-btn {
    background: var(--primary-color, #8b1e3f);
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 10px 18px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: opacity 0.2s;
  }

  .primary-btn:hover {
    opacity: 0.9;
  }

  .primary-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .chips-container {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }

  .chips-label {
    font-size: 0.8rem;
    color: var(--secondary-text-color, #757575);
    margin-right: 4px;
  }

  .food-chip {
    background: var(--secondary-background-color, #f0f0f0);
    color: var(--primary-text-color, #333);
    border: 1px solid var(--divider-color, #e0e0e0);
    border-radius: 16px;
    padding: 4px 12px;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .food-chip:hover {
    background: var(--divider-color, #e0e0e0);
  }

  .food-chip.selected {
    background: var(--primary-color, #8b1e3f);
    color: #fff;
    border-color: var(--primary-color, #8b1e3f);
  }

  .reset-link {
    font-size: 0.8rem;
    color: var(--primary-color, #8b1e3f);
    background: none;
    border: none;
    cursor: pointer;
    text-decoration: underline;
    padding: 4px 6px;
  }

  /* Wine Card */
  .wine-card-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .wine-card {
    border: 1px solid var(--divider-color, #e4e4e4);
    border-radius: 10px;
    padding: 12px;
    background: var(--ha-card-background, var(--card-background-color, #ffffff));
    display: flex;
    gap: 14px;
    align-items: flex-start;
    transition: box-shadow 0.2s ease;
  }

  .wine-card:hover {
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
  }

  .wine-thumb {
    width: 60px;
    height: 80px;
    object-fit: contain;
    border-radius: 4px;
    background: #fdfdfd;
    flex-shrink: 0;
  }

  .wine-thumb-placeholder {
    width: 60px;
    height: 80px;
    background: var(--secondary-background-color, #f0f0f0);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--secondary-text-color, #999);
    flex-shrink: 0;
  }

  .wine-thumb-placeholder svg {
    width: 32px;
    height: 32px;
    fill: currentColor;
  }

  .wine-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .wine-title {
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.25;
  }

  .wine-subtitle {
    font-size: 0.85rem;
    color: var(--secondary-text-color, #666);
  }

  .wine-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 4px 0;
    align-items: center;
  }

  .badge {
    font-size: 0.75rem;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 4px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .badge-rating {
    background: #fff8e1;
    color: #b78103;
    border: 1px solid #ffe082;
  }

  /* Window Badges */
  .badge-ready {
    background: #e8f5e9;
    color: #2e7d32;
    border: 1px solid #c8e6c9;
  }

  .badge-near_past_peak {
    background: #fff3e0;
    color: #e65100;
    border: 1px solid #ffe0b2;
  }

  .badge-hold {
    background: #e3f2fd;
    color: #1565c0;
    border: 1px solid #bbdefb;
  }

  .badge-past_peak {
    background: #ffebee;
    color: #c62828;
    border: 1px solid #ffcdd2;
  }

  .badge-unknown {
    background: #f5f5f5;
    color: #757575;
    border: 1px solid #e0e0e0;
  }

  .pairing-reason {
    font-size: 0.82rem;
    background: var(--secondary-background-color, #f9f9f9);
    padding: 6px 10px;
    border-radius: 6px;
    border-left: 3px solid var(--primary-color, #8b1e3f);
    margin-top: 4px;
    line-height: 1.35;
    color: var(--primary-text-color, #333);
  }

  /* Bottles Inventory list */
  .bottles-list {
    margin-top: 6px;
    border-top: 1px dashed var(--divider-color, #eee);
    padding-top: 6px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .bottle-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.8rem;
    color: var(--secondary-text-color, #555);
  }

  .bottle-loc {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .bottle-loc svg {
    width: 14px;
    height: 14px;
    fill: currentColor;
  }

  .drink-btn {
    background: transparent;
    border: 1px solid var(--primary-color, #8b1e3f);
    color: var(--primary-color, #8b1e3f);
    border-radius: 6px;
    padding: 3px 8px;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transition: all 0.2s;
  }

  .drink-btn svg {
    width: 12px;
    height: 12px;
    fill: currentColor;
  }

  .drink-btn:hover {
    background: var(--primary-color, #8b1e3f);
    color: #fff;
  }

  /* Drinking Windows Tab */
  .windows-tab {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .search-filter-row {
    display: flex;
    gap: 8px;
  }

  .status-chips-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 8px;
  }

  .status-chip {
    padding: 4px 10px;
    border-radius: 14px;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid transparent;
  }

  .group-section {
    border: 1px solid var(--divider-color, #e0e0e0);
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 10px;
  }

  .group-header {
    background: var(--secondary-background-color, #fafafa);
    padding: 10px 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.92rem;
    user-select: none;
  }

  .group-header:hover {
    background: var(--divider-color, #f0f0f0);
  }

  .group-header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .group-count {
    background: rgba(0, 0, 0, 0.08);
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .group-chevron svg {
    width: 18px;
    height: 18px;
    fill: currentColor;
    transition: transform 0.2s;
  }

  .group-chevron.open svg {
    transform: rotate(180deg);
  }

  .group-wines-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px;
  }

  /* Empty / Loading States */
  .empty-state {
    text-align: center;
    padding: 30px 16px;
    color: var(--secondary-text-color, #888);
    font-size: 0.9rem;
  }

  .spinner-box {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 40px 16px;
    gap: 10px;
    color: var(--secondary-text-color, #777);
  }

  .spinner {
    width: 24px;
    height: 24px;
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top-color: var(--primary-color, #8b1e3f);
    animation: spin 0.8s linear infinite;
  }

  /* Modal Backdrop & Dialog */
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 16px;
  }

  .modal-dialog {
    background: var(--ha-card-background, var(--card-background-color, #ffffff));
    border-radius: 14px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
    max-width: 440px;
    width: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .modal-header {
    padding: 16px;
    border-bottom: 1px solid var(--divider-color, #eee);
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .modal-header svg {
    width: 24px;
    height: 24px;
    fill: var(--primary-color, #8b1e3f);
  }

  .modal-body {
    padding: 16px;
    font-size: 0.9rem;
    line-height: 1.4;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .modal-wine-info {
    background: var(--secondary-background-color, #f9f9f9);
    padding: 10px 12px;
    border-radius: 8px;
    font-size: 0.85rem;
  }

  .modal-footer {
    padding: 12px 16px;
    border-top: 1px solid var(--divider-color, #eee);
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    background: var(--secondary-background-color, #fafafa);
  }

  .btn-secondary {
    background: transparent;
    border: 1px solid var(--divider-color, #ccc);
    padding: 8px 14px;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    color: var(--primary-text-color, #333);
  }

  .btn-secondary:hover {
    background: var(--divider-color, #eee);
  }

  .btn-danger {
    background: var(--error-color, #c62828);
    color: #fff;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .btn-danger:hover {
    opacity: 0.9;
  }

  .btn-danger:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Nu drinken */
  .now-tab {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .hint-banner,
  .warning-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 8px;
    font-size: 0.85rem;
    background: #fff3e0;
    color: #e65100;
    border: 1px solid #ffe0b2;
    text-align: left;
  }

  .warning-banner {
    margin: 0 16px 12px;
  }

  .hint-banner {
    cursor: pointer;
    font: inherit;
    font-size: 0.85rem;
  }

  .hint-banner:hover {
    background: #ffe0b2;
  }

  .hint-banner svg,
  .warning-banner svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    fill: currentColor;
  }

  /* Bottles summary: one action per wine */
  .bottle-summary {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 8px;
    font-size: 0.8rem;
    color: var(--secondary-text-color, #555);
  }

  .bottle-spots {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .drink-btn {
    flex-shrink: 0;
  }

  /* Location picker */
  .spot-options {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 12px;
  }

  .spot-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border: 1px solid var(--divider-color, #ddd);
    border-radius: 8px;
    background: transparent;
    color: var(--primary-text-color, #212121);
    font: inherit;
    font-size: 0.9rem;
    cursor: pointer;
    text-align: left;
  }

  .spot-option:hover {
    border-color: var(--primary-color, #8b1e3f);
    color: var(--primary-color, #8b1e3f);
  }

  .spot-option span:first-child {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .spot-option svg {
    width: 16px;
    height: 16px;
    fill: currentColor;
  }

  .spot-count {
    font-weight: 600;
  }

  /* Undo / error toasts */
  .toast-stack {
    position: fixed;
    left: 50%;
    bottom: 16px;
    transform: translateX(-50%);
    width: min(440px, calc(100vw - 32px));
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 1000;
  }

  .toast {
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 10px;
    background: #323232;
    color: #fff;
    font-size: 0.9rem;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
  }

  .toast svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    fill: currentColor;
  }

  .toast-error {
    background: var(--error-color, #c62828);
  }

  .toast-text {
    flex: 1;
    min-width: 0;
  }

  .toast-action {
    background: transparent;
    border: none;
    color: #ffcc80;
    font: inherit;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.8rem;
    cursor: pointer;
    padding: 4px 6px;
    flex-shrink: 0;
  }

  .toast-error .toast-action {
    color: #fff;
  }

  .toast-progress {
    position: absolute;
    left: 0;
    bottom: 0;
    height: 3px;
    width: 100%;
    background: #ffcc80;
    transform-origin: left;
    animation-name: toast-countdown;
    animation-timing-function: linear;
    animation-fill-mode: forwards;
  }

  @keyframes toast-countdown {
    from { transform: scaleX(1); }
    to { transform: scaleX(0); }
  }

  /* Narrow cards (phone, small dashboard column) */
  @container (max-width: 420px) {
    .tab-btn {
      padding: 8px 4px;
      font-size: 0.82rem;
    }

    .tab-btn svg {
      display: none;
    }
  }
`;

// SVG Icons
const ICON_BOTTLE = `<svg viewBox="0 0 24 24"><path d="M12,2A2,2 0 0,0 10,4V5.17C7.61,6.58 6,9.1 6,12V20A2,2 0 0,0 8,22H16A2,2 0 0,0 18,20V12C18,9.1 16.39,6.58 14,5.17V4A2,2 0 0,0 12,2M12,4A0,0 0 0,1 12,4V5H12V4M8,12C8,9.79 9.79,8 12,8C14.21,8 16,9.79 16,12V20H8V12Z" /></svg>`;
const ICON_GLASS = `<svg viewBox="0 0 24 24"><path d="M5,2H19V4L13,10V18H18V20H6V18H11V10L5,4V2M7.4,4L10.4,7H13.6L16.6,4H7.4Z" /></svg>`;
const ICON_REFRESH = `<svg viewBox="0 0 24 24"><path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z" /></svg>`;
const ICON_SEARCH = `<svg viewBox="0 0 24 24"><path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" /></svg>`;
const ICON_STAR = `<svg viewBox="0 0 24 24"><path d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z" /></svg>`;
const ICON_LOCATION = `<svg viewBox="0 0 24 24"><path d="M12,2C15.31,2 18,4.66 18,7.95C18,12.41 12,19 12,19C12,19 6,12.41 6,7.95C6,4.66 8.69,2 12,2M12,6A2,2 0 0,0 10,8A2,2 0 0,0 12,10A2,2 0 0,0 14,8A2,2 0 0,0 12,6Z" /></svg>`;
const ICON_CHEVRON = `<svg viewBox="0 0 24 24"><path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z" /></svg>`;
const ICON_ALERT = `<svg viewBox="0 0 24 24"><path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z" /></svg>`;
const ICON_CLOCK = `<svg viewBox="0 0 24 24"><path d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z" /></svg>`;

const STATUS_LABELS = {
  ready: "Op dronk",
  near_past_peak: "Binnenkort drinken",
  hold: "Nog wegleggen",
  past_peak: "Voorbij piek",
  unknown: "Venster onbekend",
};
const STATUS_ORDER = ["near_past_peak", "ready", "hold", "past_peak", "unknown"];
const DEFAULT_TABS = ["now", "pairing", "windows"];
const NOW_LIMIT = 5;
const UNDO_MS = 8000;
const ERROR_TOAST_MS = 8000;

/** Escape text for safe use in HTML content and attribute values. */
function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Only allow http(s) image URLs (Vivino uses protocol-relative "//images..." too). */
function safeUrl(url) {
  if (!url) return null;
  const full = String(url).startsWith("//") ? `https:${url}` : String(url);
  return /^https?:\/\//i.test(full) ? full : null;
}

function bottleId(bottle) {
  return bottle.bottle_id ?? bottle.id;
}

function vintageId(wine) {
  return wine.vintage_id ?? wine.id;
}

/** Distinct (location, bin) spots of a wine's bottles, each with its bottles. */
function bottleSpots(bottles) {
  const spots = new Map();
  for (const b of bottles) {
    const location = b.location_name || "Kelder";
    const key = JSON.stringify([location, b.bin || null]);
    if (!spots.has(key)) spots.set(key, { location, bin: b.bin || null, bottles: [] });
    spots.get(key).bottles.push(b);
  }
  return [...spots.values()];
}

export class VivinoCellarCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this._hass = null;
    this._config = {
      title: "Wijnkelder",
      default_tab: "now",
      tabs: DEFAULT_TABS,
    };

    this._currentTab = "now";
    this._cellarData = null;
    this._loading = false;
    this._error = null;
    this._refreshing = false;

    // Live updates
    this._unsubscribe = null;
    this._subscribing = false;

    // Pairing tab state
    this._dishInput = "";
    this._selectedFoodIds = new Set();
    this._pairingResults = null;
    this._pairingLoading = false;
    this._pairingError = null;

    // Drinking Windows tab state
    this._searchQuery = "";
    this._expandedGroups = {
      near_past_peak: true,
      ready: true,
      hold: false,
      past_peak: false,
      unknown: false,
    };

    // Drinking: bottle id -> { timer, startedAt, vintageId, label, committing }
    this._pendingDrinks = new Map();
    this._drinkErrors = [];
    this._spotPicker = null; // vintage id whose location picker is open
    this._wineIndex = new Map();

    this._onPageHide = () => this._flushPendingDrinks();
  }

  setConfig(config) {
    if (!config) {
      throw new Error("Invalid configuration");
    }
    this._config = {
      title: config.title || "Wijnkelder",
      default_tab: config.default_tab || "now",
      tabs: Array.isArray(config.tabs) && config.tabs.length > 0 ? config.tabs : DEFAULT_TABS,
      ...config,
    };
    this._currentTab = this._config.tabs.includes(this._config.default_tab)
      ? this._config.default_tab
      : this._config.tabs[0];
    this._render();
  }

  set hass(hass) {
    const firstHass = !this._hass && hass;
    this._hass = hass;
    if (firstHass && this.isConnected) {
      this._subscribe();
    }
  }

  connectedCallback() {
    window.addEventListener("pagehide", this._onPageHide);
    if (this._hass) this._subscribe();
    this._render();
  }

  disconnectedCallback() {
    window.removeEventListener("pagehide", this._onPageHide);
    this._flushPendingDrinks();
    this._unsubscribeUpdates();
  }

  getCardSize() {
    return 6;
  }

  // ---------------------------------------------------------------------------
  // Data loading & live updates
  // ---------------------------------------------------------------------------

  async _subscribe() {
    if (!this._hass || this._unsubscribe || this._subscribing) return;
    this._subscribing = true;
    if (!this._cellarData) {
      this._loading = true;
      this._render();
    }

    try {
      this._unsubscribe = await this._hass.connection.subscribeMessage(
        (data) => {
          this._cellarData = data;
          this._loading = false;
          this._error = null;
          this._render();
        },
        { type: "vivino_cellar/subscribe" }
      );
      if (!this.isConnected) this._unsubscribeUpdates();
    } catch (err) {
      // Older backend without the subscribe command: load once.
      await this._loadCellarData();
    } finally {
      this._subscribing = false;
    }
  }

  _unsubscribeUpdates() {
    if (this._unsubscribe) {
      const unsub = this._unsubscribe;
      this._unsubscribe = null;
      Promise.resolve(unsub()).catch(() => {});
    }
  }

  async _loadCellarData() {
    if (!this._hass) return;
    this._loading = true;
    this._error = null;
    this._render();

    try {
      this._cellarData = await this._hass.callWS({ type: "vivino_cellar/cellar" });
    } catch (err) {
      this._error = err.message || "Fout bij ophalen van keldergegevens.";
    } finally {
      this._loading = false;
      this._render();
    }
  }

  async _handleRefresh() {
    if (!this._hass || this._refreshing) return;
    this._refreshing = true;
    this._render();

    try {
      await this._hass.callWS({ type: "vivino_cellar/refresh" });
      if (!this._unsubscribe) {
        this._cellarData = await this._hass.callWS({ type: "vivino_cellar/cellar" });
      }
      this._error = null;
    } catch (err) {
      this._error = err.message || "Fout bij vernieuwen van kelder.";
    } finally {
      this._refreshing = false;
      this._render();
    }
  }

  /** Cellar wines with pending (undoable) drinks already taken out, plus counts. */
  _viewData() {
    const data = this._cellarData || {};
    const wines = (data.wines || []).map((wine) => this._withoutPending(wine));
    const counts = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0]));
    let total = 0;
    for (const wine of wines) {
      const n = wine.bottles.length;
      total += n;
      counts[wine.window_status || "unknown"] = (counts[wine.window_status || "unknown"] || 0) + n;
    }
    return { wines, counts, total };
  }

  _withoutPending(wine) {
    const bottles = (wine.bottles || []).filter((b) => !this._pendingDrinks.has(bottleId(b)));
    return { ...wine, bottles, bottle_count: bottles.length };
  }

  // ---------------------------------------------------------------------------
  // Pairing
  // ---------------------------------------------------------------------------

  async _handlePairingSearch() {
    if (!this._hass) return;
    const dish = this._dishInput.trim();
    const foodIds = Array.from(this._selectedFoodIds);

    if (!dish && foodIds.length === 0) {
      this._pairingResults = null;
      this._pairingError = "Voer een gerecht in of kies een categorie.";
      this._render();
      return;
    }

    this._pairingLoading = true;
    this._pairingError = null;
    this._render();

    try {
      const payload = { type: "vivino_cellar/pairing" };
      if (dish) {
        payload.dish = dish;
      } else {
        payload.food_ids = foodIds;
      }

      const res = await this._hass.callWS(payload);
      this._pairingResults = res.matches || res.pairings || [];
    } catch (err) {
      this._pairingError = err.message || "Fout bij zoeken naar pairing.";
      this._pairingResults = null;
    } finally {
      this._pairingLoading = false;
      this._render();
    }
  }

  _handleFoodChipClick(foodId) {
    if (this._selectedFoodIds.has(foodId)) {
      this._selectedFoodIds.delete(foodId);
    } else {
      this._selectedFoodIds.add(foodId);
    }
    // Food chips and dish text are mutually exclusive for the WS call
    if (this._selectedFoodIds.size > 0) {
      this._dishInput = "";
      this._handlePairingSearch();
    } else {
      this._pairingResults = null;
      this._render();
    }
  }

  _handleResetPairing() {
    this._dishInput = "";
    this._selectedFoodIds.clear();
    this._pairingResults = null;
    this._pairingError = null;
    this._render();
  }

  // ---------------------------------------------------------------------------
  // Drinking with undo
  // ---------------------------------------------------------------------------

  /** "Ontkurken" pressed on a wine: drink directly, or ask where when bottles differ. */
  _handleDrinkWine(vid) {
    const wine = this._wineIndex.get(vid);
    if (!wine || wine.bottles.length === 0) return;
    const spots = bottleSpots(wine.bottles);
    if (spots.length > 1) {
      this._spotPicker = vid;
      this._render();
      return;
    }
    this._startDrink(wine, wine.bottles[0]);
  }

  _handlePickSpot(index) {
    const wine = this._wineIndex.get(this._spotPicker);
    this._spotPicker = null;
    const spot = wine && bottleSpots(wine.bottles)[index];
    if (spot) {
      this._startDrink(wine, spot.bottles[0]);
    } else {
      this._render();
    }
  }

  _startDrink(wine, bottle) {
    const id = bottleId(bottle);
    if (this._pendingDrinks.has(id)) return;
    const name = wine.name || wine.wine_name || "Fles";
    this._pendingDrinks.set(id, {
      timer: setTimeout(() => this._commitDrink(id), UNDO_MS),
      startedAt: Date.now(),
      vintageId: vintageId(wine),
      label: wine.year ? `${name} (${wine.year})` : name,
      committing: false,
    });
    this._render();
  }

  _undoDrink(id) {
    const pending = this._pendingDrinks.get(id);
    if (!pending || pending.committing) return;
    clearTimeout(pending.timer);
    this._pendingDrinks.delete(id);
    this._render();
  }

  async _commitDrink(id) {
    const pending = this._pendingDrinks.get(id);
    if (!pending || pending.committing || !this._hass) return;
    pending.committing = true;
    clearTimeout(pending.timer);
    this._render();

    try {
      // The backend refreshes the cellar before replying, so the subscription
      // has already pushed the new data by the time this resolves.
      await this._hass.callWS({
        type: "vivino_cellar/drink",
        bottle_id: id,
        vintage_id: pending.vintageId,
      });
      this._pendingDrinks.delete(id);
      if (!this._unsubscribe) await this._loadCellarData();
    } catch (err) {
      this._pendingDrinks.delete(id);
      this._showDrinkError(`Ontkurken van ${pending.label} mislukt: ${err.message || err}`);
    }
    this._render();
  }

  _flushPendingDrinks() {
    for (const [id, pending] of this._pendingDrinks) {
      if (!pending.committing) this._commitDrink(id);
    }
  }

  _showDrinkError(message) {
    const entry = { id: Date.now() + Math.random(), message };
    this._drinkErrors.push(entry);
    setTimeout(() => this._dismissError(entry.id), ERROR_TOAST_MS);
  }

  _dismissError(id) {
    this._drinkErrors = this._drinkErrors.filter((e) => e.id !== id);
    this._render();
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  _toggleGroup(status) {
    this._expandedGroups[status] = !this._expandedGroups[status];
    this._render();
  }

  _formatLastRefresh(isoString) {
    if (!isoString) return "Nooit";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("nl-NL", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  }

  _render() {
    const shadow = this.shadowRoot;
    if (!shadow) return;

    // Keep focus and caret in text inputs across full re-renders (live updates).
    const active = shadow.activeElement;
    const focusId = active && active.id;
    const selection =
      active && typeof active.selectionStart === "number"
        ? [active.selectionStart, active.selectionEnd]
        : null;

    const data = this._cellarData || {};
    const view = this._viewData();
    this._wineIndex = new Map(view.wines.map((w) => [vintageId(w), w]));
    const lastRefresh = this._formatLastRefresh(data.last_refresh_time);
    const staleWarning =
      data.last_update_success === false
        ? `<div class="warning-banner">${ICON_ALERT} <span>Laatste update van Vivino mislukt. Gegevens kunnen verouderd zijn; controleer de Vivino-sessie.</span></div>`
        : "";

    shadow.innerHTML = `
      <style>${cardStyles}</style>
      <div class="card-container">
        <div class="card-header">
          <div class="header-left">
            <div class="header-icon">${ICON_BOTTLE}</div>
            <div class="header-titles">
              <div class="header-title">
                ${esc(this._config.title)}
                <span class="bottle-badge">${view.total} flessen</span>
              </div>
              <div class="header-subtitle">Laatst bijgewerkt: ${esc(lastRefresh)}</div>
            </div>
          </div>
          <div class="header-actions">
            <button class="icon-button ${this._refreshing ? "spinning" : ""}" id="btn-refresh" title="Vernieuw kelder">
              ${ICON_REFRESH}
            </button>
          </div>
        </div>

        ${this._error ? `<div class="error-banner">${ICON_ALERT} <span>${esc(this._error)}</span></div>` : ""}
        ${staleWarning}

        ${this._renderTabsBar()}

        ${
          this._loading
            ? `<div class="spinner-box"><div class="spinner"></div><span>Kelder laden...</span></div>`
            : this._renderCurrentTab(view)
        }

        ${this._renderSpotPicker()}
      </div>
      ${this._renderToasts()}
    `;
    this._attachEventListeners();

    if (focusId) {
      const el = shadow.getElementById(focusId);
      if (el) {
        el.focus();
        if (selection && typeof el.setSelectionRange === "function") {
          el.setSelectionRange(selection[0], selection[1]);
        }
      }
    }
  }

  _renderCurrentTab(view) {
    switch (this._currentTab) {
      case "pairing":
        return this._renderPairingTab();
      case "windows":
        return this._renderWindowsTab(view);
      default:
        return this._renderNowTab(view);
    }
  }

  _renderTabsBar() {
    const tabs = this._config.tabs || DEFAULT_TABS;
    if (tabs.length <= 1) return "";
    const defs = {
      now: `${ICON_CLOCK} Nu drinken`,
      pairing: `${ICON_GLASS} Wijn & Spijs`,
      windows: `${ICON_BOTTLE} Drinkvensters`,
    };
    return `
      <div class="tabs-bar">
        ${tabs
          .filter((t) => defs[t])
          .map(
            (t) => `<button class="tab-btn ${this._currentTab === t ? "active" : ""}" data-tab="${t}">${defs[t]}</button>`
          )
          .join("")}
      </div>
    `;
  }

  _renderNowTab(view) {
    const year = new Date().getFullYear();
    const rank = { near_past_peak: 0, ready: 1 };
    const candidates = view.wines
      .filter((w) => w.bottles.length > 0 && w.window_status in rank)
      .sort(
        (a, b) =>
          rank[a.window_status] - rank[b.window_status] ||
          (a.end_year ?? Infinity) - (b.end_year ?? Infinity) ||
          (b.rating || 0) - (a.rating || 0)
      )
      .slice(0, NOW_LIMIT);

    const pastPeak = view.counts.past_peak || 0;
    const pastPeakHint = pastPeak
      ? `<button class="hint-banner" id="btn-show-past-peak">
           ${ICON_ALERT}
           <span>${pastPeak} ${pastPeak === 1 ? "fles is" : "flessen zijn"} voorbij de piek. Bekijken</span>
         </button>`
      : "";

    if (candidates.length === 0) {
      return `
        <div class="now-tab">
          ${pastPeakHint}
          <div class="empty-state">Niets dringends: alles ligt nog te rijpen.</div>
        </div>
      `;
    }

    return `
      <div class="now-tab">
        ${pastPeakHint}
        <div class="wine-card-list">
          ${candidates.map((w) => this._renderWineCard(w, this._nowReason(w, year))).join("")}
        </div>
      </div>
    `;
  }

  _nowReason(wine, year) {
    if (wine.window_status === "near_past_peak") {
      return `Laatste jaar van het drinkvenster: drink deze in ${year}.`;
    }
    if (wine.end_year) {
      return `Op dronk tot ${wine.end_year} (nog ${wine.end_year - year} jaar).`;
    }
    return "Op dronk.";
  }

  _renderPairingTab() {
    const data = this._cellarData || {};
    const categories = data.food_categories || [];

    return `
      <div class="pairing-tab">
        <div class="pairing-controls">
          <div class="search-input-row">
            <input
              type="text"
              class="text-input"
              id="dish-input"
              placeholder="Wat eten we vanavond? (bijv. steak, pasta, risotto)..."
              value="${esc(this._dishInput)}"
            />
            <button class="primary-btn" id="btn-search-dish" ${this._pairingLoading ? "disabled" : ""}>
              ${ICON_SEARCH} Zoek
            </button>
          </div>
          ${
            categories.length > 0
              ? `
            <div class="chips-container">
              <span class="chips-label">Of kies categorieën:</span>
              ${categories
                .map(
                  (cat) => `
                <button class="food-chip ${this._selectedFoodIds.has(cat.id) ? "selected" : ""}" data-food-id="${esc(cat.id)}">
                  ${esc(cat.name)}
                </button>`
                )
                .join("")}
              ${
                this._dishInput || this._selectedFoodIds.size > 0
                  ? `<button class="reset-link" id="btn-reset-pairing">Wissen</button>`
                  : ""
              }
            </div>`
              : ""
          }
        </div>

        ${this._pairingError ? `<div class="error-banner">${ICON_ALERT} <span>${esc(this._pairingError)}</span></div>` : ""}

        ${
          this._pairingLoading
            ? `<div class="spinner-box"><div class="spinner"></div><span>Pairing suggesties berekenen...</span></div>`
            : this._renderPairingResults()
        }
      </div>
    `;
  }

  _renderPairingResults() {
    if (!this._pairingResults) {
      return `<div class="empty-state">Voer een gerecht in of kies een spijscategorie hierboven om passende wijnen uit je kelder te vinden.</div>`;
    }

    // Enrich matches with live cellar data (window years, bottles after drinks).
    const matches = this._pairingResults
      .map((match) => {
        const cellarWine = this._wineIndex.get(vintageId(match));
        return cellarWine
          ? { ...cellarWine, ...match, bottles: cellarWine.bottles }
          : this._withoutPending(match);
      })
      .filter((w) => w.bottles.length > 0);

    if (matches.length === 0) {
      return `<div class="empty-state">Geen passende wijnen gevonden in je kelder voor dit gerecht.</div>`;
    }

    for (const m of matches) {
      if (!this._wineIndex.has(vintageId(m))) this._wineIndex.set(vintageId(m), m);
    }

    return `
      <div class="wine-card-list">
        ${matches.map((wine) => this._renderWineCard(wine, wine.explanation || wine.reason)).join("")}
      </div>
    `;
  }

  _renderWindowsTab(view) {
    const query = (this._searchQuery || "").toLowerCase();
    const grouped = Object.fromEntries(STATUS_ORDER.map((s) => [s, []]));
    for (const wine of view.wines) {
      if (wine.bottles.length === 0) continue;
      (grouped[wine.window_status] || grouped.unknown).push(wine);
    }

    return `
      <div class="windows-tab">
        <div class="search-filter-row">
          <input
            type="text"
            class="text-input"
            id="windows-search-input"
            placeholder="Zoek op wijnnaam, wijnhuis of regio..."
            value="${esc(this._searchQuery)}"
          />
        </div>

        <div class="status-chips-summary">
          ${STATUS_ORDER.map(
            (status) =>
              `<span class="status-chip badge-${status}">${STATUS_LABELS[status]}: ${view.counts[status] || 0}</span>`
          ).join("")}
        </div>

        ${STATUS_ORDER.map((status) => {
          let wines = grouped[status];
          if (query) {
            wines = wines.filter((w) =>
              [w.name, w.winery, w.region].some((f) => (f || "").toLowerCase().includes(query))
            );
            if (wines.length === 0) return "";
          }

          const isOpen = !!this._expandedGroups[status];
          const bottleCount = wines.reduce((acc, w) => acc + w.bottles.length, 0);

          return `
            <div class="group-section">
              <div class="group-header" data-status="${status}">
                <div class="group-header-left">
                  <span class="badge badge-${status}">${STATUS_LABELS[status]}</span>
                  <span class="group-count">${bottleCount} flessen</span>
                </div>
                <div class="group-chevron ${isOpen ? "open" : ""}">${ICON_CHEVRON}</div>
              </div>
              ${
                isOpen
                  ? `<div class="group-wines-content">
                      ${
                        wines.length === 0
                          ? `<div class="empty-state">Geen wijnen in deze categorie</div>`
                          : wines.map((wine) => this._renderWineCard(wine)).join("")
                      }
                    </div>`
                  : ""
              }
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  _renderWineCard(wine, reason = null) {
    const wineName = wine.name || wine.wine_name || "Onbekende wijn";
    const rating = typeof wine.rating === "number" ? wine.rating.toFixed(1) : null;
    const windowStatus = wine.window_status || "unknown";
    const { start_year: startYear, end_year: endYear } = wine;
    const windowYearsText =
      startYear && endYear
        ? `${startYear} - ${endYear}`
        : startYear
        ? `Vanaf ${startYear}`
        : endYear
        ? `Tot ${endYear}`
        : null;
    const image = safeUrl(wine.image_url);
    const bottles = wine.bottles || [];
    const spots = bottleSpots(bottles);

    return `
      <div class="wine-card">
        ${
          image
            ? `<img class="wine-thumb" src="${esc(image)}" alt="${esc(wineName)}" onerror="this.style.display='none'" />`
            : `<div class="wine-thumb-placeholder">${ICON_BOTTLE}</div>`
        }
        <div class="wine-details">
          <div class="wine-title">${esc(wineName)} ${wine.year ? `(${esc(wine.year)})` : ""}</div>
          ${wine.winery ? `<div class="wine-subtitle">${esc(wine.winery)}</div>` : ""}
          <div class="wine-badges">
            ${rating ? `<span class="badge badge-rating">${ICON_STAR} ${rating}</span>` : ""}
            <span class="badge badge-${windowStatus}">${STATUS_LABELS[windowStatus] || esc(windowStatus)}</span>
            ${windowYearsText ? `<span class="badge badge-unknown">${windowYearsText}</span>` : ""}
          </div>

          ${reason ? `<div class="pairing-reason">${esc(reason)}</div>` : ""}

          <div class="bottles-list">
            ${
              bottles.length > 0
                ? `<div class="bottle-summary">
                    <div class="bottle-spots">
                      ${spots
                        .map(
                          (s) => `
                        <span class="bottle-loc">
                          ${ICON_LOCATION} ${esc(s.location)}${s.bin ? ` · vak ${esc(s.bin)}` : ""}${s.bottles.length > 1 ? ` <strong>${s.bottles.length}×</strong>` : ""}
                        </span>`
                        )
                        .join("")}
                    </div>
                    <button class="drink-btn btn-drink-action" data-vintage-id="${esc(vintageId(wine))}">
                      ${ICON_GLASS} Ontkurken
                    </button>
                  </div>`
                : `<div class="bottle-row"><span>Geen flessen op voorraad</span></div>`
            }
          </div>
        </div>
      </div>
    `;
  }

  _renderSpotPicker() {
    if (this._spotPicker === null) return "";
    const wine = this._wineIndex.get(this._spotPicker);
    if (!wine) return "";
    const name = wine.name || wine.wine_name || "Wijn";

    return `
      <div class="modal-backdrop" id="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            ${ICON_GLASS}
            <span>Welke fles pak je?</span>
          </div>
          <div class="modal-body">
            <div><strong>${esc(name)}</strong> ${wine.year ? `(${esc(wine.year)})` : ""}</div>
            <div class="spot-options">
              ${bottleSpots(wine.bottles)
                .map(
                  (s, i) => `
                <button class="spot-option" data-spot-index="${i}">
                  <span>${ICON_LOCATION} ${esc(s.location)}${s.bin ? ` · vak ${esc(s.bin)}` : ""}</span>
                  <span class="spot-count">${s.bottles.length}×</span>
                </button>`
                )
                .join("")}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" id="btn-cancel-picker">Annuleren</button>
          </div>
        </div>
      </div>
    `;
  }

  _renderToasts() {
    const undoable = [...this._pendingDrinks.entries()].filter(([, p]) => !p.committing);
    if (undoable.length === 0 && this._drinkErrors.length === 0) return "";
    const now = Date.now();

    return `
      <div class="toast-stack">
        ${this._drinkErrors
          .map(
            (e) => `
          <div class="toast toast-error">
            ${ICON_ALERT}
            <span class="toast-text">${esc(e.message)}</span>
            <button class="toast-action" data-dismiss-error="${e.id}">Sluiten</button>
          </div>`
          )
          .join("")}
        ${undoable
          .map(
            ([id, p]) => `
          <div class="toast">
            ${ICON_GLASS}
            <span class="toast-text">Ontkurkt: ${esc(p.label)}</span>
            <button class="toast-action" data-undo-bottle="${esc(id)}">Ongedaan maken</button>
            <div class="toast-progress" style="animation-duration:${UNDO_MS}ms;animation-delay:-${Math.min(now - p.startedAt, UNDO_MS)}ms"></div>
          </div>`
          )
          .join("")}
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------------

  _attachEventListeners() {
    const shadow = this.shadowRoot;
    if (!shadow) return;
    const on = (selector, handler) =>
      shadow.querySelectorAll(selector).forEach((el) => el.addEventListener("click", (e) => handler(el, e)));

    on("#btn-refresh", () => this._handleRefresh());

    on(".tab-btn", (el) => {
      this._currentTab = el.dataset.tab;
      this._render();
    });

    on("#btn-show-past-peak", () => {
      this._currentTab = "windows";
      this._expandedGroups.past_peak = true;
      this._render();
    });

    // Pairing
    const dishInput = shadow.getElementById("dish-input");
    if (dishInput) {
      dishInput.addEventListener("input", (e) => {
        this._dishInput = e.target.value;
      });
      dishInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") this._handlePairingSearch();
      });
    }
    on("#btn-search-dish", () => this._handlePairingSearch());
    on(".food-chip", (el) => this._handleFoodChipClick(parseInt(el.dataset.foodId, 10)));
    on("#btn-reset-pairing", () => this._handleResetPairing());

    // Windows
    const windowsSearch = shadow.getElementById("windows-search-input");
    if (windowsSearch) {
      windowsSearch.addEventListener("input", (e) => {
        this._searchQuery = e.target.value;
        this._render();
      });
    }
    on(".group-header", (el) => this._toggleGroup(el.dataset.status));

    // Drinking
    on(".btn-drink-action", (el, e) => {
      e.stopPropagation();
      this._handleDrinkWine(Number(el.dataset.vintageId));
    });
    on(".spot-option", (el) => this._handlePickSpot(Number(el.dataset.spotIndex)));
    on("#btn-cancel-picker", () => {
      this._spotPicker = null;
      this._render();
    });
    on("#modal-backdrop", (el, e) => {
      if (e.target === el) {
        this._spotPicker = null;
        this._render();
      }
    });
    on("[data-undo-bottle]", (el) => this._undoDrink(Number(el.dataset.undoBottle)));
    on("[data-dismiss-error]", (el) => this._dismissError(Number(el.dataset.dismissError)));
  }
}

// Define Custom Element
if (!customElements.get("vivino-cellar-card")) {
  customElements.define("vivino-cellar-card", VivinoCellarCard);
}

// Register in Home Assistant customCards registry
window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === "vivino-cellar-card")) {
  window.customCards.push({
    type: "vivino-cellar-card",
    name: "Vivino Cellar Card",
    description: "Vivino cellar wine pairing and drinking windows overview",
  });
}
