/**
 * Wine detail sheet with "Jouw beoordeling".
 * Fires vc-close, vc-drink {vintageId}, vc-rate {vintageId, rating, note}.
 */
import { css, html, nothing } from "lit";

import { reasonLine, STATUS_LABELS, WINE_TYPES } from "../logic/status.js";
import { bottleSpots, formatRating, safeUrl, vintageId } from "../logic/util.js";
import { themeStyles } from "../styles/theme.js";
import { fire } from "./events.js";
import { VcModal } from "./modal.js";

const SOURCES = { vivino: "volgens Vivino", ai_estimate: "AI-schatting" };

export class VcDetailSheet extends VcModal {
  static properties = {
    wine: { attribute: false },
    draft: { attribute: false }, // {vid, rating, note, status, error} from the root
    saved: { attribute: false }, // {rating, note} | null | undefined (not loaded)
    _rating: { state: true },
    _note: { state: true },
  };

  willUpdate(changed) {
    if (!changed.has("draft") || !this.draft) return;
    const prev = changed.get("draft");
    const fresh = !prev || prev.vid !== this.draft.vid || (prev.status === "loading" && this.draft.status !== "loading");
    if (fresh) {
      this._rating = this.draft.rating ?? null;
      this._note = this.draft.note ?? "";
    }
  }

  get _changed() {
    if (this._rating === null || this._rating === undefined) return false;
    const s = this.saved;
    return !s || s.rating !== this._rating || (s.note || "") !== (this._note || "");
  }

  _save() {
    if (!this._changed || this.draft?.status === "saving") return;
    fire(this, "vc-rate", { vintageId: vintageId(this.wine), rating: this._rating, note: this._note || "" });
  }

  _stars() {
    const value = this._rating ?? 0;
    return [1, 2, 3, 4, 5].map((n) => {
      const icon = value >= n ? "mdi:star" : value >= n - 0.5 ? "mdi:star-half-full" : "mdi:star-outline";
      const label = (v) => `${String(v).replace(".", ",")} ${v === 1 ? "ster" : "sterren"}`;
      return html`
        <span class="star ${value >= n - 0.5 ? "on" : ""}">
          <ha-icon icon=${icon}></ha-icon>
          <button class="half left" aria-label=${label(n - 0.5)} ?disabled=${n === 1}
            @click=${() => (this._rating = n - 0.5)}></button>
          <button class="half right" aria-label=${label(n)} @click=${() => (this._rating = n)}></button>
        </span>
      `;
    });
  }

  _ratingSection() {
    const d = this.draft;
    if (!d) return nothing;
    if (d.status === "loading") {
      return html`<section class="rating"><h4>Jouw beoordeling</h4><div class="muted">Laden…</div></section>`;
    }
    const status =
      d.status === "saving"
        ? html`<span class="muted">Opslaan…</span>`
        : d.status === "error"
          ? html`<span class="err">${d.error || "Mislukt"}</span>`
          : d.status === "saved" && !this._changed
            ? html`<span class="ok">Opgeslagen op Vivino</span>`
            : this.saved
              ? nothing
              : html`<span class="muted">Nog niet beoordeeld</span>`;
    return html`
      <section class="rating">
        <h4>Jouw beoordeling</h4>
        <div class="stars" role="group" aria-label="Kies een beoordeling">
          ${this._stars()}
          <span class="value">${this._rating ? formatRating(this._rating) : "–"}</span>
        </div>
        <textarea
          class="input"
          id="rating-note"
          rows="2"
          placeholder="Notitie (optioneel)"
          .value=${this._note ?? ""}
          @input=${(e) => (this._note = e.target.value)}
        ></textarea>
        <div class="actions">
          ${status}
          <button class="btn btn-primary save" ?disabled=${!this._changed || d.status === "saving"} @click=${this._save}>
            Opslaan
          </button>
        </div>
      </section>
    `;
  }

  render() {
    const w = this.wine;
    if (!w) return nothing;
    const name = w.name || "Onbekende wijn";
    const status = w.window_status || "unknown";
    const image = safeUrl(w.image_url);
    const link = safeUrl(w.vivino_url);
    const window =
      w.start_year && w.end_year
        ? `${w.start_year} – ${w.end_year}`
        : w.start_year
          ? `vanaf ${w.start_year}`
          : w.end_year
            ? `tot ${w.end_year}`
            : "onbekend";
    const source = SOURCES[w.window_source];
    const type = [WINE_TYPES[w.type_id], w.style].filter(Boolean).join(" · ");
    const origin = [w.region, w.country].filter(Boolean).join(", ");
    const foods = (w.foods || []).map((f) => f.name).filter(Boolean).join(", ");
    const grapes = (w.grapes || []).filter(Boolean).join(", ");
    const spots = bottleSpots(w.bottles || []);
    const row = (label, value) => (value ? html`<div class="dl-row"><dt>${label}</dt><dd>${value}</dd></div>` : nothing);

    return html`
      <dialog aria-labelledby="t" @cancel=${this._cancel} @close=${this._closed} @click=${this._backdrop}>
        <div class="sheet s-${status}">
          <div class="hero">
            ${image
              ? html`<img class="photo" src=${image} alt="" @error=${(e) => (e.target.style.visibility = "hidden")} />`
              : html`<div class="photo bottle-placeholder"><ha-icon icon="mdi:bottle-wine"></ha-icon></div>`}
            <div class="heading">
              <div class="name" id="t">${name}${w.year ? ` ${w.year}` : ""}</div>
              ${w.winery ? html`<div class="muted">${w.winery}</div>` : nothing}
              <div class="badges">
                ${typeof w.rating === "number"
                  ? html`<span class="badge star-badge"><ha-icon icon="mdi:star"></ha-icon>${formatRating(w.rating)}${w.ratings_count ? ` · ${w.ratings_count} beoordelingen` : ""}</span>`
                  : nothing}
                <span class="badge">${STATUS_LABELS[status] || status}</span>
              </div>
              <div class="reason">${reasonLine(w, new Date().getFullYear())}</div>
            </div>
          </div>
          <div class="body">
            <dl>
              ${row("Drinkvenster", html`${window}${source ? html` <span class="muted">(${source})</span>` : nothing}`)}
              ${row("Soort", type)}
              ${row("Herkomst", origin)}
              ${row("Druiven", grapes)}
              ${row("Past bij", foods)}
              ${row(
                "Flessen",
                spots.length
                  ? spots.map((s) => html`<div>${s.location}${s.bin ? ` · vak ${s.bin}` : ""}: ${s.bottles.length}×</div>`)
                  : "Geen flessen op voorraad"
              )}
            </dl>
            ${this._ratingSection()}
          </div>
          <div class="foot">
            ${link
              ? html`<a class="vivino" href=${link} target="_blank" rel="noopener noreferrer">
                  Bekijk op Vivino <ha-icon icon="mdi:open-in-new"></ha-icon>
                </a>`
              : nothing}
            <button class="btn" id="close" autofocus @click=${() => fire(this, "vc-close")}>Sluiten</button>
            ${(w.bottles || []).length
              ? html`<button class="btn btn-primary" @click=${() => fire(this, "vc-drink", { vintageId: vintageId(w) })}>
                  <ha-icon icon="mdi:glass-wine"></ha-icon> Ontkurken
                </button>`
              : nothing}
          </div>
        </div>
      </dialog>
    `;
  }

  static styles = [
    themeStyles,
    VcModal.modalStyles,
    css`
      .hero {
        display: flex;
        gap: 16px;
        padding: 16px;
        border-bottom: 1px solid var(--vc-divider);
        border-left: 4px solid var(--vc-edge);
      }
      .photo { width: 64px; height: 108px; flex: none; object-fit: contain; border-radius: var(--vc-radius-sm); }
      .heading { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
      .name { font-size: 18px; font-weight: 600; line-height: 1.25; }
      .badges { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 2px; }
      .star-badge { --vc-edge: var(--vc-star); }
      .reason { font-size: 13px; font-weight: 500; color: var(--vc-edge); }
      dl { margin: 0; display: grid; gap: 10px; }
      .dl-row { display: grid; grid-template-columns: 110px 1fr; gap: 8px; font-size: 14px; }
      dt { color: var(--vc-muted); }
      dd { margin: 0; overflow-wrap: anywhere; }
      .rating {
        margin-top: 16px;
        padding-top: 14px;
        border-top: 1px solid var(--vc-divider);
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .rating h4 { margin: 0; font-size: 14px; }
      .stars { display: flex; align-items: center; gap: 2px; }
      .star { position: relative; width: 36px; height: 36px; display: inline-flex; color: var(--vc-divider); }
      .star.on { color: var(--vc-star); }
      .star ha-icon { --mdc-icon-size: 34px; pointer-events: none; }
      .half { position: absolute; top: 0; width: 50%; height: 100%; padding: 0; border: none; background: transparent; cursor: pointer; }
      .half.left { left: 0; }
      .half.right { right: 0; }
      .half[disabled] { cursor: default; }
      .value { margin-left: 10px; font-weight: 600; }
      .actions { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 13px; }
      .actions .save { margin-left: auto; }
      .ok { color: var(--vc-status-ready); }
      .err { color: var(--vc-status-past_peak); }
      .vivino {
        margin-right: auto;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: var(--vc-accent);
        font-size: 14px;
      }
      .vivino ha-icon { --mdc-icon-size: 16px; }
      @media (max-width: 420px) {
        .dl-row { grid-template-columns: 1fr; gap: 2px; }
      }
    `,
  ];
}

if (!customElements.get("vc-detail-sheet")) customElements.define("vc-detail-sheet", VcDetailSheet);
