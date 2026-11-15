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

  .header-icon ha-icon {
    --mdc-icon-size: 28px;
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

  .badge svg {
    width: 12px;
    height: 12px;
    fill: currentColor;
    flex-shrink: 0;
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

  .badge-can_wait {
    background: #e0f2f1;
    color: #00695c;
    border: 1px solid #b2dfdb;
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
  .cellar-tab {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .filter-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 8px;
  }

  .filter-select {
    min-width: 0;
    padding: 8px 10px;
    border: 1px solid var(--divider-color, #ccc);
    border-radius: 8px;
    font: inherit;
    font-size: 0.85rem;
    background: var(--input-fill-color, var(--ha-card-background, #fff));
    color: var(--primary-text-color, #212121);
    cursor: pointer;
  }

  /* Sort is not a filter: own row, never truncated. */
  .filter-select[data-filter="sort"] {
    grid-column: 1 / -1;
  }

  .filter-select.active {
    border-color: var(--primary-color, #8b1e3f);
    box-shadow: inset 0 0 0 1px var(--primary-color, #8b1e3f);
  }

  .result-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-size: 0.85rem;
    color: var(--secondary-text-color, #757575);
  }

  .btn-link {
    background: none;
    border: none;
    padding: 4px 0;
    font: inherit;
    color: var(--primary-color, #8b1e3f);
    cursor: pointer;
    text-decoration: underline;
  }

  .cellar-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
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
    font: inherit;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    border: 2px solid transparent;
    transition: opacity 0.15s ease;
  }

  .status-chip:disabled {
    cursor: default;
    opacity: 0.45;
  }

  .status-chips-summary.filtering .status-chip:not(.active) {
    opacity: 0.45;
  }

  .status-chip.active {
    border-color: currentColor;
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
  /* Native <dialog> shown with showModal(): it lives in the top layer, so a
     transformed parent (Bubble Card popup) cannot push it out of view. The
     dialog fills the screen; clicks on its padding count as backdrop clicks. */
  dialog.modal-layer {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    max-width: none;
    max-height: none;
    margin: 0;
    padding: 16px;
    box-sizing: border-box;
    border: none;
    background: transparent;
    color: inherit;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  dialog.modal-layer:not([open]) {
    display: none;
  }

  dialog.modal-layer::backdrop {
    background: rgba(0, 0, 0, 0.5);
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

  /* Wine detail sheet */
  .wine-card.clickable {
    cursor: pointer;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .wine-card.clickable:hover {
    border-color: var(--primary-color, #8b1e3f);
  }

  .wine-card.clickable:focus-visible {
    outline: 2px solid var(--primary-color, #8b1e3f);
    outline-offset: 2px;
  }

  .detail-sheet {
    max-width: 520px;
    max-height: calc(100vh - 32px);
  }

  .detail-sheet .modal-body {
    overflow-y: auto;
  }

  .detail-hero {
    display: flex;
    gap: 16px;
    padding: 16px;
    border-bottom: 1px solid var(--divider-color, #eee);
  }

  .detail-image {
    width: 72px;
    height: 108px;
    object-fit: contain;
    flex-shrink: 0;
    border-radius: 8px;
    background: #fff;
  }

  .detail-image.placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--secondary-background-color, #f5f5f5);
    color: var(--secondary-text-color, #757575);
  }

  .detail-image.placeholder svg {
    width: 32px;
    height: 32px;
    fill: currentColor;
  }

  .detail-heading {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  .detail-list {
    margin: 0;
    display: grid;
    gap: 10px;
  }

  .detail-row {
    display: grid;
    grid-template-columns: 110px 1fr;
    gap: 8px;
    font-size: 0.9rem;
  }

  .detail-row dt {
    color: var(--secondary-text-color, #757575);
  }

  .detail-row dd {
    margin: 0;
    color: var(--primary-text-color, #212121);
    overflow-wrap: anywhere;
  }

  .muted {
    color: var(--secondary-text-color, #757575);
  }

  .rating-section {
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid var(--divider-color, #eee);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .rating-title {
    font-weight: 600;
    font-size: 0.9rem;
  }

  .rating-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .star-picker {
    display: flex;
    gap: 2px;
  }

  /* One star, split into two tap targets: left half and right half. */
  .star-slot {
    position: relative;
    width: 34px;
    height: 34px;
  }

  .star-icon,
  .star-fill {
    position: absolute;
    inset: 0;
    display: block;
    overflow: hidden;
    pointer-events: none;
  }

  .star-icon svg,
  .star-fill svg {
    width: 34px;
    height: 34px;
  }

  .star-icon svg {
    fill: var(--divider-color, #ddd);
  }

  .star-fill svg {
    fill: #f5a623;
  }

  .star-half {
    position: absolute;
    top: 0;
    width: 50%;
    height: 100%;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
  }

  .star-half.left {
    left: 0;
  }

  .star-half.right {
    right: 0;
  }

  .star-half:disabled {
    cursor: default;
  }

  .star-half:focus-visible {
    outline: 2px solid var(--primary-color, #8b1e3f);
    outline-offset: -2px;
    border-radius: 4px;
  }

  .rating-value {
    font-weight: 600;
    min-width: 2ch;
  }

  .rating-note {
    resize: vertical;
    font: inherit;
  }

  .rating-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-size: 0.85rem;
  }

  .rating-actions .drink-btn {
    margin-left: auto;
  }

  .rating-actions .drink-btn:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .rating-ok {
    color: #2e7d32;
  }

  .rating-error {
    color: var(--error-color, #c62828);
  }

  .detail-actions {
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  .detail-buttons {
    display: flex;
    gap: 8px;
    margin-left: auto;
  }

  @container (max-width: 420px) {
    .detail-row {
      grid-template-columns: 1fr;
      gap: 2px;
    }
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
