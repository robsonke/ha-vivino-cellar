/** Ranking for "what do we open tonight": default order and mood chips. */
import { getLanguage, t } from "./i18n.js";
import { STATUS_LABELS, WINE_TYPES } from "./status.js";

const CHIP_ICONS = {
  aperitif: "🥂",
  refreshing: "🧊",
  winter_evening: "🔥",
  with_food: "🍽",
  special: "✨",
  drink_up: "⏳",
};

/** Mood chips in display order; `label` is read in the current language. */
export const CHIPS = Object.freeze(
  Object.entries(CHIP_ICONS).map(([id, icon]) =>
    Object.freeze({
      id,
      icon,
      get label() {
        return `${icon} ${t(`chip.${id}`)}`;
      },
    })
  )
);

// Vivino type ids
const RED = 1;
const WHITE = 2;
const SPARKLING = 3;
const ROSE = 4;
const DESSERT = 7;
const FORTIFIED = 24;

/** Grapes that make a full-bodied (4) or light-bodied (2) wine when Vivino has no body score. */
export const FULL_GRAPES = new Set(
  [
    "cabernet sauvignon", "syrah", "shiraz", "malbec", "nebbiolo", "tempranillo", "aglianico",
    "tannat", "petite sirah", "mourvèdre", "mourvedre", "primitivo", "zinfandel", "sagrantino",
  ]
);
export const LIGHT_GRAPES = new Set(
  ["pinot noir", "gamay", "zweigelt", "schiava", "frappato", "cinsault"]
);

const SAVE_FOR_LATER = 4.3; // the aperitif chip skips bottles rated this high unless nothing else fits
const DRINKABLE = { near_past_peak: 0, ready: 1, can_wait: 2 };

const nullsLast = (v) => (v === null || v === undefined ? Infinity : v);
const inStock = (w) => (w.bottles || []).length > 0;

/** Body 1-5: Vivino's score, else guessed from the grapes, else medium (3). */
export function bodyOf(wine) {
  if (typeof wine.style_body === "number") return wine.style_body;
  const grapes = (wine.grapes || []).map((g) => String(g).toLowerCase());
  if (grapes.some((g) => FULL_GRAPES.has(g))) return 4;
  if (grapes.some((g) => LIGHT_GRAPES.has(g))) return 2;
  return 3;
}

function byDefault(a, b) {
  return (
    (DRINKABLE[a.window_status] ?? 9) - (DRINKABLE[b.window_status] ?? 9) ||
    nullsLast(a.end_year) - nullsLast(b.end_year) ||
    (b.rating ?? 0) - (a.rating ?? 0)
  );
}

const CHIP_RULES = {
  aperitif: {
    keep: (w) =>
      [SPARKLING, ROSE, WHITE].includes(w.type_id) || (w.type_id === RED && bodyOf(w) <= 3),
    rank: (a, b) => {
      const group = (w) => ([SPARKLING, ROSE].includes(w.type_id) ? 0 : w.type_id === WHITE ? 1 : 2);
      return group(a) - group(b) || bodyOf(a) - bodyOf(b);
    },
  },
  refreshing: {
    keep: (w) => [WHITE, ROSE, SPARKLING].includes(w.type_id),
    rank: (a, b) =>
      (b.style_acidity ?? -Infinity) - (a.style_acidity ?? -Infinity) || bodyOf(a) - bodyOf(b),
  },
  winter_evening: {
    keep: (w) =>
      (w.type_id === RED && bodyOf(w) >= 4) || [FORTIFIED, DESSERT].includes(w.type_id),
    rank: (a, b) => bodyOf(b) - bodyOf(a) || (b.rating ?? 0) - (a.rating ?? 0),
  },
  special: {
    keep: () => true,
    rank: (a, b) =>
      (b.rating ?? -Infinity) - (a.rating ?? -Infinity) || nullsLast(a.year) - nullsLast(b.year),
  },
};

/** Wines to suggest tonight, best first. `chipId` null or "with_food" means the default order. */
export function rankTonight(wines, chipId) {
  const stock = (wines || []).filter(inStock);

  if (chipId === "drink_up") {
    const near = stock.filter((w) => w.window_status === "near_past_peak").sort(byDefault);
    const past = stock
      .filter((w) => w.window_status === "past_peak")
      .sort((a, b) => (b.end_year ?? -Infinity) - (a.end_year ?? -Infinity) || byDefault(a, b));
    return [...near, ...past];
  }

  const drinkable = stock.filter((w) => w.window_status in DRINKABLE);
  const rule = CHIP_RULES[chipId];
  if (!rule) return drinkable.sort(byDefault);

  let picks = drinkable.filter(rule.keep);
  if (chipId === "aperitif") {
    const everyday = picks.filter((w) => (w.rating ?? 0) < SAVE_FOR_LATER);
    if (everyday.length) picks = everyday;
  }
  return picks.sort((a, b) => rule.rank(a, b) || byDefault(a, b));
}

/** "Light, red", "Fresh, white", "Full, bold": type and weight in a few words. */
export function styleLine(wine) {
  const type = WINE_TYPES[wine.type_id];
  const lowerType = type ? type.toLocaleLowerCase(getLanguage()) : "";
  const body = bodyOf(wine);
  if (wine.type_id === RED && body >= 4) return t("style.full_bold");
  if (wine.type_id !== RED && type && (wine.style_acidity ?? 0) >= 3.5) return t("style.fresh", { type: lowerType });
  const style = t(body <= 2 ? "style.light" : body >= 4 ? "style.full" : "style.smooth");
  return type ? t("style.with_type", { style, type: lowerType }) : style;
}

/** One short line under a wine in the Drink now list. */
export function hintLine(wine, chipId, year) {
  const end = wine.end_year;
  if (wine.window_status === "past_peak") {
    const text = t("style.past_peak");
    return end ? `${text} · ${t("window.since", { year: end })}` : text;
  }
  if (wine.window_status === "can_wait") {
    const text = STATUS_LABELS.can_wait;
    return end ? `${text} · ${t("window.until", { year: end })}` : text;
  }
  const text = styleLine(wine);
  if (wine.window_status === "near_past_peak") return `${text} · ${t("window.drink_in", { year: end ?? year })}`;
  return end ? `${text} · ${t("window.until", { year: end })}` : text;
}
