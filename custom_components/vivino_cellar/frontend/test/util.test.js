import { test } from "node:test";
import assert from "node:assert/strict";

import {
  bottleSpots,
  formatRating,
  safeUrl,
  viewWines,
  vintageId,
} from "../src/logic/util.js";
import { reasonLine, STATUS_LABELS, STATUS_ORDER, WINE_TYPES } from "../src/logic/status.js";

test("safeUrl only allows http(s)", () => {
  assert.equal(safeUrl("javascript:alert(1)"), null);
  assert.equal(safeUrl(null), null);
  assert.equal(safeUrl("ftp://x"), null);
  assert.equal(
    safeUrl("https://www.vivino.com/w/1?year=2015"),
    "https://www.vivino.com/w/1?year=2015"
  );
});

test("bottleSpots groups bottles by location and bin", () => {
  const spots = bottleSpots([
    { bottle_id: 1, location_name: "Koelkast", bin: "A1" },
    { bottle_id: 2, location_name: "Koelkast", bin: "A1" },
    { bottle_id: 3, location_name: "", bin: null },
  ]);
  assert.deepEqual(
    spots.map((s) => [s.location, s.bin, s.bottles.length]),
    [
      ["Koelkast", "A1", 2],
      ["Kelder", null, 1],
    ]
  );
});

test("viewWines hides bottles with a pending drink", () => {
  const wines = [
    { vintage_id: 5, bottles: [{ bottle_id: 11 }, { bottle_id: 12 }], bottle_count: 2 },
  ];
  const [w] = viewWines(wines, new Set([12]));
  assert.deepEqual(
    w.bottles.map((b) => b.bottle_id),
    [11]
  );
  assert.equal(w.bottle_count, 1);
  assert.equal(wines[0].bottles.length, 2, "input is not mutated");
});

test("vintageId and formatRating", () => {
  assert.equal(vintageId({ vintage_id: 7 }), 7);
  assert.equal(vintageId({ id: 8 }), 8);
  assert.equal(formatRating(3.5), "3,5");
  assert.equal(formatRating(4), "4,0");
  assert.equal(formatRating(null), "");
});

test("status tables", () => {
  assert.deepEqual(STATUS_ORDER, [
    "near_past_peak",
    "ready",
    "can_wait",
    "hold",
    "past_peak",
    "unknown",
  ]);
  assert.equal(STATUS_LABELS.can_wait, "Kan nog liggen");
  assert.equal(WINE_TYPES[24], "Versterkt");
});

test("reasonLine per status (spec strings)", () => {
  const y = 2026;
  assert.equal(
    reasonLine({ window_status: "near_past_peak", end_year: 2026 }, y),
    "Laatste jaar: drink in 2026"
  );
  assert.equal(reasonLine({ window_status: "ready", end_year: 2029 }, y), "Op dronk tot 2029");
  assert.equal(
    reasonLine({ window_status: "can_wait", end_year: 2032 }, y),
    "Kan nog liggen tot 2032, mag ook nu"
  );
  assert.equal(
    reasonLine({ window_status: "past_peak", end_year: 2024 }, y),
    "Voorbij de piek sinds 2024: snel open"
  );
  assert.equal(reasonLine({ window_status: "ready", end_year: null }, y), "Op dronk");
  assert.equal(reasonLine({ window_status: "unknown" }, y), "Drinkvenster onbekend");
});
