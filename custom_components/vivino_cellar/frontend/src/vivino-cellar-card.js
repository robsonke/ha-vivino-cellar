/**
 * Vivino Cellar Custom Lovelace Card and Sidebar Panel Component.
 */

import { cardStyles } from "./styles.js";

// SVG Icons
const ICON_BOTTLE = `<svg viewBox="0 0 24 24"><path d="M12,2A2,2 0 0,0 10,4V5.17C7.61,6.58 6,9.1 6,12V20A2,2 0 0,0 8,22H16A2,2 0 0,0 18,20V12C18,9.1 16.39,6.58 14,5.17V4A2,2 0 0,0 12,2M12,4A0,0 0 0,1 12,4V5H12V4M8,12C8,9.79 9.79,8 12,8C14.21,8 16,9.79 16,12V20H8V12Z" /></svg>`;
const ICON_GLASS = `<svg viewBox="0 0 24 24"><path d="M5,2H19V4L13,10V18H18V20H6V18H11V10L5,4V2M7.4,4L10.4,7H13.6L16.6,4H7.4Z" /></svg>`;
const ICON_REFRESH = `<svg viewBox="0 0 24 24"><path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z" /></svg>`;
const ICON_SEARCH = `<svg viewBox="0 0 24 24"><path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" /></svg>`;
const ICON_STAR = `<svg viewBox="0 0 24 24"><path d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z" /></svg>`;
const ICON_LOCATION = `<svg viewBox="0 0 24 24"><path d="M12,2C15.31,2 18,4.66 18,7.95C18,12.41 12,19 12,19C12,19 6,12.41 6,7.95C6,4.66 8.69,2 12,2M12,6A2,2 0 0,0 10,8A2,2 0 0,0 12,10A2,2 0 0,0 14,8A2,2 0 0,0 12,6Z" /></svg>`;
const ICON_CHEVRON = `<svg viewBox="0 0 24 24"><path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z" /></svg>`;
const ICON_ALERT = `<svg viewBox="0 0 24 24"><path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z" /></svg>`;

const STATUS_LABELS = {
  ready: "Op dronk",
  near_past_peak: "Binnenkort drinken",
  hold: "Nog wegleggen",
  past_peak: "Voorbij piek",
  unknown: "Venster onbekend",
};

export class VivinoCellarCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this._hass = null;
    this._config = {
      title: "Wijnkelder",
      default_tab: "pairing",
      tabs: ["pairing", "windows"],
    };

    this._currentTab = "pairing";
    this._cellarData = null;
    this._loading = false;
    this._error = null;
    this._refreshing = false;

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

    // Modal state
    this._drinkModal = null;
    this._drinking = false;
  }

  static get observedAttributes() {
    return [];
  }

  setConfig(config) {
    if (!config) {
      throw new Error("Invalid configuration");
    }
    this._config = {
      title: config.title || "Wijnkelder",
      default_tab: config.default_tab || "pairing",
      tabs: Array.isArray(config.tabs) && config.tabs.length > 0 ? config.tabs : ["pairing", "windows"],
      ...config,
    };
    this._currentTab = this._config.default_tab;
    this._render();
  }

  set hass(hass) {
    const firstHass = !this._hass && hass;
    this._hass = hass;
    if (firstHass) {
      this._loadCellarData();
    }
  }

  getCardSize() {
    return 6;
  }

  async _loadCellarData() {
    if (!this._hass) return;
    this._loading = true;
    this._error = null;
    this._render();

    try {
      const res = await this._hass.callWS({ type: "vivino_cellar/cellar" });
      this._cellarData = res;
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
      const res = await this._hass.callWS({ type: "vivino_cellar/cellar" });
      this._cellarData = res;
      this._error = null;
    } catch (err) {
      this._error = err.message || "Fout bij vernieuwen van kelder.";
    } finally {
      this._refreshing = false;
      this._render();
    }
  }

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
      this._pairingResults = res.pairings || [];
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
    // If food chips clicked, clear dish text for single-criterion WS call
    if (this._selectedFoodIds.size > 0) {
      this._dishInput = "";
    }
    this._render();
    if (this._selectedFoodIds.size > 0) {
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

  _openDrinkModal(bottle, wine) {
    this._drinkModal = {
      bottle_id: bottle.bottle_id || bottle.id,
      vintage_id: wine.vintage_id || wine.id,
      wine_name: wine.name || wine.wine_name,
      winery: wine.winery,
      year: wine.year,
      location_name: bottle.location_name || "Onbekende locatie",
      bin: bottle.bin,
    };
    this._render();
  }

  _closeDrinkModal() {
    this._drinkModal = null;
    this._drinking = false;
    this._render();
  }

  async _confirmDrink() {
    if (!this._hass || !this._drinkModal || this._drinking) return;
    this._drinking = true;
    this._render();

    try {
      await this._hass.callWS({
        type: "vivino_cellar/drink",
        bottle_id: this._drinkModal.bottle_id,
        vintage_id: this._drinkModal.vintage_id,
      });

      this._closeDrinkModal();

      // Refresh cellar data
      const res = await this._hass.callWS({ type: "vivino_cellar/cellar" });
      this._cellarData = res;

      // Also update pairing results if open
      if (this._pairingResults) {
        this._handlePairingSearch();
      }
    } catch (err) {
      alert(`Fout bij ontkurken: ${err.message || err}`);
      this._drinking = false;
      this._render();
    }
  }

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

    const data = this._cellarData || {};
    const totalBottles = data.total_bottles || 0;
    const lastRefresh = this._formatLastRefresh(data.last_refresh_time);

    shadow.innerHTML = `
      <style>${cardStyles}</style>
      <div class="card-container">
        <!-- Header -->
        <div class="card-header">
          <div class="header-left">
            <div class="header-icon">${ICON_BOTTLE}</div>
            <div class="header-titles">
              <div class="header-title">
                ${this._config.title}
                <span class="bottle-badge">${totalBottles} flessen</span>
              </div>
              <div class="header-subtitle">Laatst bijgewerkt: ${lastRefresh}</div>
            </div>
          </div>
          <div class="header-actions">
            <button class="icon-button ${this._refreshing ? "spinning" : ""}" id="btn-refresh" title="Vernieuw kelder">
              ${ICON_REFRESH}
            </button>
          </div>
        </div>

        <!-- Error Banner -->
        ${
          this._error
            ? `<div class="error-banner">${ICON_ALERT} <span>${this._error}</span></div>`
            : ""
        }

        <!-- Tab Selection -->
        ${this._renderTabsBar()}

        <!-- Content Area -->
        ${
          this._loading
            ? `<div class="spinner-box"><div class="spinner"></div><span>Kelder laden...</span></div>`
            : this._currentTab === "pairing"
            ? this._renderPairingTab()
            : this._renderWindowsTab()
        }

        <!-- Confirmation Modal -->
        ${this._renderDrinkModal()}
      </div>
    `;

    this._attachEventListeners();
  }

  _renderTabsBar() {
    const tabs = this._config.tabs || ["pairing", "windows"];
    if (tabs.length <= 1) return "";

    return `
      <div class="tabs-bar">
        ${
          tabs.includes("pairing")
            ? `<button class="tab-btn ${this._currentTab === "pairing" ? "active" : ""}" id="tab-btn-pairing">
                ${ICON_GLASS} Wijn & Spijs
              </button>`
            : ""
        }
        ${
          tabs.includes("windows")
            ? `<button class="tab-btn ${this._currentTab === "windows" ? "active" : ""}" id="tab-btn-windows">
                ${ICON_BOTTLE} Drinkvensters
              </button>`
            : ""
        }
      </div>
    `;
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
              value="${this._dishInput}"
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
                <button
                  class="food-chip ${this._selectedFoodIds.has(cat.id) ? "selected" : ""}"
                  data-food-id="${cat.id}"
                >
                  ${cat.name}
                </button>
              `
                )
                .join("")}
              ${
                this._dishInput || this._selectedFoodIds.size > 0
                  ? `<button class="reset-link" id="btn-reset-pairing">Wissen</button>`
                  : ""
              }
            </div>
          `
              : ""
          }
        </div>

        ${
          this._pairingError
            ? `<div class="error-banner">${ICON_ALERT} <span>${this._pairingError}</span></div>`
            : ""
        }

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
      return `
        <div class="empty-state">
          Voer een gerecht in of kies een spijscategorie hierboven om passende wijnen uit je kelder te vinden.
        </div>
      `;
    }

    if (this._pairingResults.length === 0) {
      return `
        <div class="empty-state">
          Geen passende wijnen gevonden in je kelder voor dit gerecht.
        </div>
      `;
    }

    return `
      <div class="wine-card-list">
        ${this._pairingResults.map((wine) => this._renderWineCard(wine, true)).join("")}
      </div>
    `;
  }

  _renderWindowsTab() {
    const data = this._cellarData || {};
    const grouped = data.grouped_wines || {};
    const counts = data.status_counts || {};

    const query = (this._searchQuery || "").toLowerCase();

    // Priority status order
    const statusOrder = ["near_past_peak", "ready", "hold", "past_peak", "unknown"];

    return `
      <div class="windows-tab">
        <div class="search-filter-row">
          <input
            type="text"
            class="text-input"
            id="windows-search-input"
            placeholder="Zoek op wijnnaam, wijnhuis of regio..."
            value="${this._searchQuery}"
          />
        </div>

        <div class="status-chips-summary">
          ${statusOrder
            .map((status) => {
              const count = counts[status] || 0;
              return `<span class="status-chip badge-${status}">${STATUS_LABELS[status] || status}: ${count}</span>`;
            })
            .join("")}
        </div>

        ${statusOrder
          .map((status) => {
            let wines = grouped[status] || [];
            if (query) {
              wines = wines.filter((w) => {
                const name = (w.name || "").toLowerCase();
                const winery = (w.winery || "").toLowerCase();
                const region = (w.region || "").toLowerCase();
                return name.includes(query) || winery.includes(query) || region.includes(query);
              });
            }

            if (wines.length === 0 && query) return "";

            const isOpen = !!this._expandedGroups[status];
            const bottleCount = wines.reduce((acc, w) => acc + (w.bottle_count || 0), 0);

            return `
              <div class="group-section">
                <div class="group-header" data-status="${status}">
                  <div class="group-header-left">
                    <span class="badge badge-${status}">${STATUS_LABELS[status] || status}</span>
                    <span class="group-count">${bottleCount} flessen</span>
                  </div>
                  <div class="group-chevron ${isOpen ? "open" : ""}">
                    ${ICON_CHEVRON}
                  </div>
                </div>
                ${
                  isOpen
                    ? `
                  <div class="group-wines-content">
                    ${
                      wines.length === 0
                        ? `<div class="empty-state">Geen wijnen in deze categorie</div>`
                        : wines.map((wine) => this._renderWineCard(wine, false)).join("")
                    }
                  </div>
                `
                    : ""
                }
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  }

  _renderWineCard(wine, showReason) {
    const wineName = wine.wine_name || wine.name || "Onbekende wijn";
    const winery = wine.winery || "";
    const year = wine.year || "";
    const rating = wine.rating ? wine.rating.toFixed(1) : null;
    const windowStatus = wine.window_status || "unknown";
    const windowLabel = STATUS_LABELS[windowStatus] || windowStatus;

    const startYear = wine.start_year;
    const endYear = wine.end_year;
    const windowYearsText =
      startYear && endYear
        ? `${startYear} - ${endYear}`
        : startYear
        ? `Vanaf ${startYear}`
        : endYear
        ? `Tot ${endYear}`
        : null;

    const bottles = wine.bottles || [];

    return `
      <div class="wine-card">
        ${
          wine.image_url
            ? `<img class="wine-thumb" src="${wine.image_url}" alt="${wineName}" onerror="this.style.display='none'" />`
            : `<div class="wine-thumb-placeholder">${ICON_BOTTLE}</div>`
        }
        <div class="wine-details">
          <div class="wine-title">${wineName} ${year ? `(${year})` : ""}</div>
          ${winery ? `<div class="wine-subtitle">${winery}</div>` : ""}

          <div class="wine-badges">
            ${
              rating
                ? `<span class="badge badge-rating">${ICON_STAR} ${rating}</span>`
                : ""
            }
            <span class="badge badge-${windowStatus}">${windowLabel}</span>
            ${
              windowYearsText
                ? `<span class="badge badge-unknown">${windowYearsText}</span>`
                : ""
            }
          </div>

          ${
            showReason && wine.reason
              ? `<div class="pairing-reason">${wine.reason}</div>`
              : ""
          }

          <div class="bottles-list">
            ${
              bottles.length > 0
                ? bottles
                    .map((b) => {
                      const locText = [b.location_name, b.bin ? `Vak: ${b.bin}` : null]
                        .filter(Boolean)
                        .join(" • ");
                      return `
                  <div class="bottle-row">
                    <span class="bottle-loc">${ICON_LOCATION} ${locText || "Kelder"}</span>
                    <button
                      class="drink-btn btn-drink-action"
                      data-bottle='${JSON.stringify(b)}'
                      data-wine='${JSON.stringify({
                        id: wine.vintage_id || wine.id,
                        name: wineName,
                        winery,
                        year,
                      })}'
                    >
                      ${ICON_GLASS} Fles ontkurken
                    </button>
                  </div>
                `;
                    })
                    .join("")
                : `<div class="bottle-row"><span>Geen flessen op voorraad</span></div>`
            }
          </div>
        </div>
      </div>
    `;
  }

  _renderDrinkModal() {
    if (!this._drinkModal) return "";

    const m = this._drinkModal;
    return `
      <div class="modal-backdrop" id="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            ${ICON_GLASS}
            <span>Fles ontkurken?</span>
          </div>
          <div class="modal-body">
            <div>Weet je zeker dat je deze fles wilt verwijderen uit je Vivino kelder?</div>
            <div class="modal-wine-info">
              <strong>${m.wine_name}</strong> ${m.year ? `(${m.year})` : ""}<br/>
              ${m.winery ? `<em>${m.winery}</em><br/>` : ""}
              ${ICON_LOCATION} Locatie: ${m.location_name}${m.bin ? ` (Vak ${m.bin})` : ""}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" id="btn-cancel-drink" ${this._drinking ? "disabled" : ""}>
              Annuleren
            </button>
            <button class="btn-danger" id="btn-confirm-drink" ${this._drinking ? "disabled" : ""}>
              ${this._drinking ? "Bezig..." : "Ja, ontkurken"}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  _attachEventListeners() {
    const shadow = this.shadowRoot;
    if (!shadow) return;

    // Header Refresh button
    const btnRefresh = shadow.getElementById("btn-refresh");
    if (btnRefresh) {
      btnRefresh.addEventListener("click", () => this._handleRefresh());
    }

    // Tab buttons
    const tabPairing = shadow.getElementById("tab-btn-pairing");
    if (tabPairing) {
      tabPairing.addEventListener("click", () => {
        this._currentTab = "pairing";
        this._render();
      });
    }

    const tabWindows = shadow.getElementById("tab-btn-windows");
    if (tabWindows) {
      tabWindows.addEventListener("click", () => {
        this._currentTab = "windows";
        this._render();
      });
    }

    // Pairing Tab: Dish input & button
    const dishInput = shadow.getElementById("dish-input");
    const btnSearchDish = shadow.getElementById("btn-search-dish");
    if (dishInput && btnSearchDish) {
      dishInput.addEventListener("input", (e) => {
        this._dishInput = e.target.value;
      });
      dishInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          this._handlePairingSearch();
        }
      });
      btnSearchDish.addEventListener("click", () => this._handlePairingSearch());
    }

    // Food Chips
    shadow.querySelectorAll(".food-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const foodId = parseInt(chip.getAttribute("data-food-id"), 10);
        this._handleFoodChipClick(foodId);
      });
    });

    // Reset pairing
    const btnResetPairing = shadow.getElementById("btn-reset-pairing");
    if (btnResetPairing) {
      btnResetPairing.addEventListener("click", () => this._handleResetPairing());
    }

    // Windows Tab: Search filter
    const windowsSearch = shadow.getElementById("windows-search-input");
    if (windowsSearch) {
      windowsSearch.addEventListener("input", (e) => {
        this._searchQuery = e.target.value;
        this._render();
        // Restore focus and cursor position
        const updatedInput = this.shadowRoot.getElementById("windows-search-input");
        if (updatedInput) {
          updatedInput.focus();
          updatedInput.setSelectionRange(e.target.value.length, e.target.value.length);
        }
      });
    }

    // Windows Tab: Accordion group headers
    shadow.querySelectorAll(".group-header").forEach((header) => {
      header.addEventListener("click", () => {
        const status = header.getAttribute("data-status");
        this._toggleGroup(status);
      });
    });

    // Drink Action Buttons
    shadow.querySelectorAll(".btn-drink-action").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        try {
          const bottle = JSON.parse(btn.getAttribute("data-bottle"));
          const wine = JSON.parse(btn.getAttribute("data-wine"));
          this._openDrinkModal(bottle, wine);
        } catch (err) {
          console.error("Error parsing drink data:", err);
        }
      });
    });

    // Modal buttons
    const btnCancel = shadow.getElementById("btn-cancel-drink");
    if (btnCancel) {
      btnCancel.addEventListener("click", () => this._closeDrinkModal());
    }

    const btnConfirm = shadow.getElementById("btn-confirm-drink");
    if (btnConfirm) {
      btnConfirm.addEventListener("click", () => this._confirmDrink());
    }

    const backdrop = shadow.getElementById("modal-backdrop");
    if (backdrop) {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) {
          this._closeDrinkModal();
        }
      });
    }
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
