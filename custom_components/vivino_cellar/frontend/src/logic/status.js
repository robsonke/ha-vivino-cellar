/** Drinking-window statuses, labels and wine types. */
import { t } from "./i18n.js";

export const STATUS_ORDER = ["near_past_peak", "ready", "can_wait", "hold", "past_peak", "unknown"];

/** Vivino type ids with a name. */
export const WINE_TYPE_IDS = [1, 2, 3, 4, 7, 24];

/** {key: text} whose texts are looked up on every read, so they follow the language. */
function textMap(keys, keyOf) {
  const map = {};
  for (const k of keys) {
    Object.defineProperty(map, k, { enumerable: true, get: () => t(keyOf(k)) });
  }
  return Object.freeze(map);
}

export const STATUS_LABELS = textMap(STATUS_ORDER, (s) => `status.${s}`);

export const WINE_TYPES = textMap(WINE_TYPE_IDS, (id) => `wine_type.${id}`);

/** Name of a Vivino wine type; "Type 9" for one we do not know. */
export function wineTypeName(typeId) {
  return WINE_TYPES[typeId] || t("wine_type.fallback", { id: typeId });
}

/** One-line reason shown on the top pick. */
export function reasonLine(wine, year) {
  const end = wine.end_year;
  switch (wine.window_status) {
    case "near_past_peak":
      return t("reason.near_past_peak", { year: end ?? year });
    case "ready":
      return end ? t("reason.ready", { year: end }) : t("reason.ready_open");
    case "can_wait":
      return end ? t("reason.can_wait", { year: end }) : t("reason.can_wait_open");
    case "past_peak":
      return end ? t("reason.past_peak", { year: end }) : t("reason.past_peak_open");
    case "hold":
      return wine.start_year ? t("reason.hold", { year: wine.start_year }) : t("reason.hold_open");
    default:
      return t("reason.unknown");
  }
}
