import { test } from "node:test";
import assert from "node:assert/strict";

import { bodyOf, CHIPS, hintLine, rankTonight } from "../src/logic/ranking.js";

let nextId = 1;
const wine = (over) => ({
  vintage_id: nextId++,
  name: `W${nextId}`,
  type_id: 1,
  window_status: "ready",
  end_year: 2029,
  rating: 3.8,
  year: 2018,
  grapes: [],
  style_body: null,
  style_acidity: null,
  bottles: [{ bottle_id: nextId * 10 }],
  ...over,
});
const names = (ws) => ws.map((w) => w.name);

test("chip ids and labels", () => {
  assert.deepEqual(
    CHIPS.map((c) => c.id),
    ["borrelen", "verfrissend", "winteravond", "eten", "bijzonder", "moet_op"]
  );
  assert.equal(CHIPS[2].label, "🔥 Winteravond");
});

test("default: near_past_peak, then ready by end year, then can_wait; others out", () => {
  const ws = [
    wine({ name: "canwait", window_status: "can_wait", end_year: 2033 }),
    wine({ name: "ready2030", end_year: 2030 }),
    wine({ name: "near", window_status: "near_past_peak", end_year: 2026 }),
    wine({ name: "ready2028", end_year: 2028 }),
    wine({ name: "hold", window_status: "hold" }),
    wine({ name: "past", window_status: "past_peak" }),
    wine({ name: "empty", bottles: [] }),
  ];
  assert.deepEqual(names(rankTonight(ws, null)), ["near", "ready2028", "ready2030", "canwait"]);
  assert.deepEqual(names(rankTonight(ws, "eten")), names(rankTonight(ws, null)));
});

test("bodyOf: Vivino score, else grape, else medium", () => {
  assert.equal(bodyOf(wine({ style_body: 4.5 })), 4.5);
  assert.equal(bodyOf(wine({ grapes: ["Gamay"] })), 2);
  assert.equal(bodyOf(wine({ grapes: ["Nebbiolo"] })), 4);
  assert.equal(bodyOf(wine({ grapes: ["cabernet sauvignon"] })), 4);
  assert.equal(bodyOf(wine({ grapes: ["Onbekend"] })), 3);
  assert.equal(bodyOf(wine({ grapes: undefined })), 3);
});

test("borrelen: bubbles/rosé, then white, then light reds; no full reds; save top bottles", () => {
  const ws = [
    wine({ name: "lightred", grapes: ["Gamay"] }),
    wine({ name: "white", type_id: 2 }),
    wine({ name: "sparkling", type_id: 3 }),
    wine({ name: "rose", type_id: 4 }),
    wine({ name: "fullred", style_body: 4.5 }),
    wine({ name: "nebbiolo", grapes: ["Nebbiolo"] }),
    wine({ name: "unknownred", grapes: ["Onbekend"] }),
    wine({ name: "toprated", type_id: 3, rating: 4.5 }),
  ];
  const got = names(rankTonight(ws, "borrelen"));
  assert.deepEqual(got.slice(0, 2).sort(), ["rose", "sparkling"]);
  assert.equal(got[2], "white");
  assert.ok(got.includes("lightred") && got.includes("unknownred"));
  assert.ok(got.indexOf("lightred") < got.indexOf("unknownred"), "lighter body first");
  for (const n of ["fullred", "nebbiolo", "toprated"]) assert.ok(!got.includes(n), n);
});

test("borrelen falls back to top bottles when nothing else fits", () => {
  const ws = [wine({ name: "only", type_id: 3, rating: 4.6 })];
  assert.deepEqual(names(rankTonight(ws, "borrelen")), ["only"]);
});

test("verfrissend: white/rosé/sparkling, fresher first, unknown acidity last", () => {
  const ws = [
    wine({ name: "red", type_id: 1, style_acidity: 5 }),
    wine({ name: "flat", type_id: 2, style_acidity: 2 }),
    wine({ name: "fresh", type_id: 2, style_acidity: 4.5 }),
    wine({ name: "unknown", type_id: 4, style_acidity: null }),
    wine({ name: "bubbles", type_id: 3, style_acidity: 3.5 }),
  ];
  assert.deepEqual(names(rankTonight(ws, "verfrissend")), ["fresh", "bubbles", "flat", "unknown"]);
});

test("winteravond: full reds (also by grape), fortified and dessert; fullest first", () => {
  const ws = [
    wine({ name: "light", grapes: ["Pinot Noir"] }),
    wine({ name: "cab", grapes: ["Cabernet Sauvignon"] }),
    wine({ name: "big", style_body: 5 }),
    wine({ name: "port", type_id: 24, style_body: 4.5 }),
    wine({ name: "white", type_id: 2, style_body: 5 }),
    wine({ name: "medium", grapes: ["Onbekend"] }),
  ];
  const got = names(rankTonight(ws, "winteravond"));
  assert.deepEqual(got, ["big", "port", "cab"]);
});

test("bijzonder: highest rating, then oldest; no rating last", () => {
  const ws = [
    wine({ name: "norating", rating: null }),
    wine({ name: "good-young", rating: 4.4, year: 2020 }),
    wine({ name: "good-old", rating: 4.4, year: 2010 }),
    wine({ name: "best", rating: 4.7 }),
  ];
  assert.deepEqual(names(rankTonight(ws, "bijzonder")), ["best", "good-old", "good-young", "norating"]);
});

test("moet_op: last-year wines first, then past peak, least far gone first", () => {
  const ws = [
    wine({ name: "past2015", window_status: "past_peak", end_year: 2015 }),
    wine({ name: "near", window_status: "near_past_peak", end_year: 2026 }),
    wine({ name: "past2025", window_status: "past_peak", end_year: 2025 }),
    wine({ name: "ready", window_status: "ready" }),
  ];
  assert.deepEqual(names(rankTonight(ws, "moet_op")), ["near", "past2025", "past2015"]);
});

test("hintLine wording", () => {
  assert.equal(hintLine(wine({ type_id: 2, style_acidity: 4, end_year: 2028 }), "verfrissend", 2026), "Fris, wit · tot 2028");
  assert.equal(hintLine(wine({ style_body: 4.5, end_year: 2030 }), null, 2026), "Vol, krachtig · tot 2030");
  assert.equal(hintLine(wine({ window_status: "can_wait", end_year: 2032 }), null, 2026), "Kan nog liggen · tot 2032");
  assert.equal(hintLine(wine({ window_status: "past_peak", end_year: 2024 }), "moet_op", 2026), "Voorbij de piek · sinds 2024");
});

test("hintLine never shows null/undefined/NaN", () => {
  const bare = { vintage_id: 99, bottles: [{ bottle_id: 1 }] };
  for (const chip of [null, ...CHIPS.map((c) => c.id)]) {
    const line = hintLine(bare, chip, 2026);
    assert.equal(typeof line, "string");
    assert.ok(!/null|undefined|NaN/.test(line), `${chip}: ${line}`);
  }
});

test("styleLine names the wine type for the top pick", async () => {
  const { styleLine } = await import("../src/logic/ranking.js");
  assert.equal(styleLine(wine({ style_body: 2 })), "Licht, rood");
  assert.equal(styleLine(wine({ type_id: 2, style_acidity: 4 })), "Fris, wit");
});
