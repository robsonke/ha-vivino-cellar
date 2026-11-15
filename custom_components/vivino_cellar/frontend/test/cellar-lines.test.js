import { test } from "node:test";
import assert from "node:assert/strict";

// cellarLines lives in the Lit component file; import it without the custom element side effects
const { cellarLines } = await import("../src/logic/cellar-lines.js");

const b = (loc, bin) => ({ bottle_id: Math.random(), location_name: loc, bin });

test("two fixed lines: status · window · rating, then spots", () => {
  const w = { window_status: "ready", end_year: 2029, rating: 4.1, bottles: [b("Kelder", "A1"), b("Kelder", "A1"), b("Kelder", "A1")] };
  assert.deepEqual(cellarLines(w), ["Op dronk · tot 2029 · ★ 4,1", "Kelder · vak A1 · 3×"]);
});

test("hold shows the start year; missing parts are skipped", () => {
  const w = { window_status: "hold", start_year: 2028, end_year: 2035, rating: null, bottles: [b("", null)] };
  assert.deepEqual(cellarLines(w), ["Nog wegleggen · vanaf 2028", "Kelder · 1×"]);
});

test("more than two spots end with +N", () => {
  const w = { window_status: "unknown", bottles: [b("A", null), b("B", null), b("C", null), b("D", null)] };
  assert.deepEqual(cellarLines(w), ["Venster onbekend", "A · 1× · B · 1× · +2"]);
});
