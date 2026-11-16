/** Kelder filtering, facet options and sorting. */
import { STATUS_ORDER } from "./status.js";

export const EMPTY_FILTERS = {
  type: "",
  country: "",
  region: "",
  grape: "",
  minBottles: 0,
  sort: "status",
};

/** Does a wine pass every filter except the ones named in `skip`? */
export function matchesFilters(wine, filters, statusFilter, query, skip = []) {
  const bottles = wine.bottles || [];
  if (bottles.length === 0) return false;
  if (bottles.length < (filters.minBottles || 0)) return false;
  const q = (query || "").toLowerCase();
  if (
    q &&
    ![wine.name, wine.winery, wine.region, ...(wine.grapes || [])].some((v) =>
      (v || "").toLowerCase().includes(q)
    )
  )
    return false;
  if (!skip.includes("type") && filters.type && String(wine.type_id) !== filters.type) return false;
  if (!skip.includes("country") && filters.country && wine.country !== filters.country) return false;
  if (!skip.includes("region") && filters.region && wine.region !== filters.region) return false;
  if (!skip.includes("grape") && filters.grape && !(wine.grapes || []).includes(filters.grape))
    return false;
  if (!skip.includes("status") && statusFilter && (wine.window_status || "unknown") !== statusFilter)
    return false;
  return true;
}

/** Options for one filter, counted in bottles over what the other filters leave. */
export function filterOptions(wines, key, valuesOf, labelOf, ctx, alsoSkip = []) {
  const counts = new Map();
  for (const wine of wines || []) {
    if (!matchesFilters(wine, ctx.filters, ctx.statusFilter, ctx.query, [key, ...alsoSkip])) continue;
    for (const v of valuesOf(wine)) {
      if (v === null || v === undefined || v === "") continue;
      counts.set(String(v), (counts.get(String(v)) || 0) + wine.bottles.length);
    }
  }
  const selected = ctx.filters[key];
  if (selected && !counts.has(selected)) counts.set(selected, 0);
  return [...counts.entries()]
    .map(([value, n]) => ({ value, label: labelOf(value), n }))
    .sort((a, b) => a.label.localeCompare(b.label, "nl"));
}

const byName = (a, b) => (a.name || "").localeCompare(b.name || "", "nl");
const nullsLast = (v) => (v === null || v === undefined ? Infinity : v);

const SORTERS = {
  drink_by: (a, b) => nullsLast(a.end_year) - nullsLast(b.end_year),
  rating: (a, b) => (b.rating ?? -Infinity) - (a.rating ?? -Infinity),
  vintage: (a, b) => nullsLast(a.year) - nullsLast(b.year),
  bottles: (a, b) => (b.bottles || []).length - (a.bottles || []).length,
  name: byName,
};

export function sortWines(wines, sort) {
  const by = SORTERS[sort];
  return [...wines].sort((a, b) => (by ? by(a, b) : 0) || byName(a, b));
}

/** Bottles per status, following every filter except the status pill. */
export function statusCounts(wines, ctx) {
  const counts = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0]));
  for (const wine of wines || []) {
    if (!matchesFilters(wine, ctx.filters, ctx.statusFilter, ctx.query, ["status"])) continue;
    const st = wine.window_status || "unknown";
    counts[st] = (counts[st] || 0) + wine.bottles.length;
  }
  return counts;
}
