/** Ranking for "what do we open tonight": default order and mood chips. */
import { WINE_TYPES } from "./status.js";

export const CHIPS = [
  { id: "borrelen", label: "🥂 Borrelen" },
  { id: "verfrissend", label: "🧊 Verfrissend" },
  { id: "winteravond", label: "🔥 Winteravond" },
  { id: "eten", label: "🍽 Bij het eten" },
  { id: "bijzonder", label: "✨ Iets bijzonders" },
  { id: "moet_op", label: "⏳ Moet op" },
];

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

const SAVE_FOR_LATER = 4.3; // Borrelen skips bottles rated this high unless nothing else fits
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
  borrelen: {
    keep: (w) =>
      [SPARKLING, ROSE, WHITE].includes(w.type_id) || (w.type_id === RED && bodyOf(w) <= 3),
    rank: (a, b) => {
      const group = (w) => ([SPARKLING, ROSE].includes(w.type_id) ? 0 : w.type_id === WHITE ? 1 : 2);
      return group(a) - group(b) || bodyOf(a) - bodyOf(b);
    },
  },
  verfrissend: {
    keep: (w) => [WHITE, ROSE, SPARKLING].includes(w.type_id),
    rank: (a, b) =>
      (b.style_acidity ?? -Infinity) - (a.style_acidity ?? -Infinity) || bodyOf(a) - bodyOf(b),
  },
  winteravond: {
    keep: (w) =>
      (w.type_id === RED && bodyOf(w) >= 4) || [FORTIFIED, DESSERT].includes(w.type_id),
    rank: (a, b) => bodyOf(b) - bodyOf(a) || (b.rating ?? 0) - (a.rating ?? 0),
  },
  bijzonder: {
    keep: () => true,
    rank: (a, b) =>
      (b.rating ?? -Infinity) - (a.rating ?? -Infinity) || nullsLast(a.year) - nullsLast(b.year),
  },
};

/** Wines to suggest tonight, best first. `chipId` null or "eten" means the default order. */
export function rankTonight(wines, chipId) {
  const stock = (wines || []).filter(inStock);

  if (chipId === "moet_op") {
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
  if (chipId === "borrelen") {
    const everyday = picks.filter((w) => (w.rating ?? 0) < SAVE_FOR_LATER);
    if (everyday.length) picks = everyday;
  }
  return picks.sort((a, b) => rule.rank(a, b) || byDefault(a, b));
}

/** "Licht, rood", "Fris, wit", "Vol, krachtig": type and weight in a few words. */
export function styleLine(wine) {
  const type = WINE_TYPES[wine.type_id];
  const body = bodyOf(wine);
  if (wine.type_id === RED && body >= 4) return "Vol, krachtig";
  if (wine.type_id !== RED && type && (wine.style_acidity ?? 0) >= 3.5) return `Fris, ${type.toLowerCase()}`;
  const adjective = body <= 2 ? "Licht" : body >= 4 ? "Vol" : "Soepel";
  return type ? `${adjective}, ${type.toLowerCase()}` : adjective;
}

/** One short line under a wine in the Nu drinken list. */
export function hintLine(wine, chipId, year) {
  const end = wine.end_year;
  if (wine.window_status === "past_peak") return end ? `Voorbij de piek · sinds ${end}` : "Voorbij de piek";
  if (wine.window_status === "can_wait") return end ? `Kan nog liggen · tot ${end}` : "Kan nog liggen";
  const text = styleLine(wine);
  if (wine.window_status === "near_past_peak") return `${text} · drink in ${end ?? year}`;
  return end ? `${text} · tot ${end}` : text;
}
