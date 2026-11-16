/** The two info lines of a row in the Cellar tab. */
import { t } from "./i18n.js";
import { STATUS_LABELS } from "./status.js";
import { bottleSpots, formatRating, spotLabel } from "./util.js";

const MAX_SPOTS = 2;

/** Two fixed lines: "Ready · until 2029 · ★ 4.1" and "Cellar · bin A1 · 3×". */
export function cellarLines(wine) {
  const status = wine.window_status || "unknown";
  const when =
    status === "hold" && wine.start_year
      ? t("window.from", { year: wine.start_year })
      : wine.end_year
        ? t("window.until", { year: wine.end_year })
        : "";
  const rating = typeof wine.rating === "number" ? `★ ${formatRating(wine.rating)}` : "";
  const first = [STATUS_LABELS[status] || status, when, rating].filter(Boolean).join(" · ");
  const spots = bottleSpots(wine.bottles).map((s) => `${spotLabel(s)} · ${s.bottles.length}×`);
  const extra = spots.length - MAX_SPOTS;
  const second = spots.slice(0, MAX_SPOTS).join(" · ") + (extra > 0 ? ` · +${extra}` : "");
  return [first, second];
}
