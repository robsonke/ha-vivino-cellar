import { test } from "node:test";
import assert from "node:assert/strict";

import {
  EMPTY_FILTERS,
  filterOptions,
  matchesFilters,
  sortWines,
  statusCounts,
} from "../src/logic/filters.js";

const bottles = (n) => Array.from({ length: n }, (_, i) => ({ bottle_id: i + 1 }));

const WINES = [
  {
    vintage_id: 1, name: "Barolo", winery: "A", region: "Barolo", country: "Italië",
    type_id: 1, grapes: ["Nebbiolo"], window_status: "ready", end_year: 2030,
    rating: 4.3, year: 2016, bottles: bottles(2),
  },
  {
    vintage_id: 2, name: "Cahors", winery: "B", region: "Cahors", country: "Frankrijk",
    type_id: 1, grapes: ["Malbec"], window_status: "near_past_peak", end_year: 2026,
    rating: 3.9, year: 2018, bottles: bottles(1),
  },
  {
    vintage_id: 3, name: "Blanc", winery: "C", region: "Bordeaux", country: "Frankrijk",
    type_id: 2, grapes: ["Sauvignon Blanc"], window_status: "ready", end_year: null,
    rating: null, year: null, bottles: bottles(1),
  },
  {
    vintage_id: 4, name: "Gone", winery: "D", region: "X", country: "Spanje",
    type_id: 1, grapes: [], window_status: "ready", end_year: 2028, bottles: [],
  },
];

const ctx = (over = {}) => ({ filters: { ...EMPTY_FILTERS }, statusFilter: null, query: "", ...over });
const run = (c) => WINES.filter((w) => matchesFilters(w, c.filters, c.statusFilter, c.query));
const ids = (ws) => ws.map((w) => w.vintage_id);

test("wines without bottles never match", () => {
  assert.deepEqual(ids(run(ctx())), [1, 2, 3]);
});

test("country filter", () => {
  assert.deepEqual(ids(run(ctx({ filters: { ...EMPTY_FILTERS, country: "Frankrijk" } }))), [2, 3]);
});

test("search matches grapes too", () => {
  assert.deepEqual(ids(run(ctx({ query: "nebb" }))), [1]);
});

test("minimum bottles", () => {
  assert.deepEqual(ids(run(ctx({ filters: { ...EMPTY_FILTERS, minBottles: 2 } }))), [1]);
});

test("status filter", () => {
  assert.deepEqual(ids(run(ctx({ statusFilter: "near_past_peak" }))), [2]);
});

test("region options follow the country filter", () => {
  const c = ctx({ filters: { ...EMPTY_FILTERS, country: "Italië" } });
  const opts = filterOptions(WINES, "region", (w) => [w.region], (v) => v, c);
  assert.deepEqual(opts.map((o) => [o.value, o.n]), [["Barolo", 2]]);
});

test("country options ignore the region filter", () => {
  const c = ctx({ filters: { ...EMPTY_FILTERS, region: "Barolo" } });
  const opts = filterOptions(WINES, "country", (w) => [w.country], (v) => v, c, ["region"]);
  assert.deepEqual(opts.map((o) => o.value), ["Frankrijk", "Italië"]);
});

test("a selected value with no matches stays listed with 0", () => {
  const c = ctx({ filters: { ...EMPTY_FILTERS, country: "Italië", grape: "Malbec" } });
  const opts = filterOptions(WINES, "grape", (w) => w.grapes || [], (v) => v, c);
  assert.ok(opts.some((o) => o.value === "Malbec" && o.n === 0));
});

test("missing fields do not throw and are not offered", () => {
  const odd = [{ vintage_id: 9, name: null, region: null, country: null, year: null, bottles: bottles(1) }];
  const c = ctx({ query: "x" });
  assert.doesNotThrow(() => odd.filter((w) => matchesFilters(w, c.filters, null, "x")));
  assert.deepEqual(filterOptions(odd, "region", (w) => [w.region], (v) => v, ctx()), []);
  assert.deepEqual(filterOptions(odd, "grape", (w) => w.grapes || [], (v) => v, ctx()), []);
});

test("sort drink_by puts missing end years last", () => {
  assert.deepEqual(ids(sortWines(run(ctx()), "drink_by")), [2, 1, 3]);
});

test("sort rating puts missing ratings last", () => {
  assert.deepEqual(ids(sortWines(run(ctx()), "rating")), [1, 2, 3]);
});

test("status counts follow the other filters (in bottles)", () => {
  const counts = statusCounts(WINES, ctx({ filters: { ...EMPTY_FILTERS, country: "Frankrijk" } }));
  assert.equal(counts.near_past_peak, 1);
  assert.equal(counts.ready, 1);
  assert.equal(counts.can_wait, 0);
});
