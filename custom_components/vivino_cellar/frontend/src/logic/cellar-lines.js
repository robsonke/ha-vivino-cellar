/** The two info lines of a Kelder row. */
import { STATUS_LABELS } from "./status.js";
import { bottleSpots, formatRating } from "./util.js";

const MAX_SPOTS = 2;

/** Two fixed lines: "Op dronk · tot 2029 · ★ 4,1" and "Kelder · vak A1 · 3×". */
export function cellarLines(wine) {
  const status = wine.window_status || "unknown";
  const when = status === "hold" && wine.start_year ? `vanaf ${wine.start_year}` : wine.end_year ? `tot ${wine.end_year}` : "";
  const rating = typeof wine.rating === "number" ? `★ ${formatRating(wine.rating)}` : "";
  const first = [STATUS_LABELS[status] || status, when, rating].filter(Boolean).join(" · ");
  const spots = bottleSpots(wine.bottles).map(
    (s) => `${s.location}${s.bin ? ` · vak ${s.bin}` : ""} · ${s.bottles.length}×`
  );
  const extra = spots.length - MAX_SPOTS;
  const second = spots.slice(0, MAX_SPOTS).join(" · ") + (extra > 0 ? ` · +${extra}` : "");
  return [first, second];
}
