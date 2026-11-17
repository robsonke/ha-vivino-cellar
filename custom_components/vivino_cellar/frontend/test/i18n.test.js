import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { getLanguage, isPlural, setLanguage, t, TRANSLATIONS } from "../src/logic/i18n.js";

const SRC = fileURLToPath(new URL("../src/", import.meta.url));

/** {"a.b": "text" | {one, other}} for every leaf (plural objects count as one leaf). */
function leaves(node, prefix = "", out = {}) {
  for (const [key, value] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string" || isPlural(value)) out[path] = value;
    else if (value && typeof value === "object") leaves(value, path, out);
    else out[path] = value;
  }
  return out;
}

const placeholders = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const texts = (value) => (typeof value === "string" ? [value] : Object.values(value));

test("en and nl have the same keys", () => {
  assert.deepEqual(Object.keys(leaves(TRANSLATIONS.nl)).sort(), Object.keys(leaves(TRANSLATIONS.en)).sort());
});

test("every text is a non-empty string or a plural object", () => {
  for (const [lang, table] of Object.entries(TRANSLATIONS)) {
    for (const [key, value] of Object.entries(leaves(table))) {
      for (const text of texts(value)) {
        assert.equal(typeof text, "string", `${lang}:${key}`);
        assert.ok(text.trim().length > 0, `${lang}:${key} is empty`);
      }
    }
  }
});

test("en and nl use the same placeholders and plural shapes", () => {
  const en = leaves(TRANSLATIONS.en);
  const nl = leaves(TRANSLATIONS.nl);
  for (const [key, enValue] of Object.entries(en)) {
    const nlValue = nl[key];
    assert.equal(isPlural(nlValue), isPlural(enValue), `${key}: plural in one language only`);
    if (isPlural(enValue)) {
      assert.deepEqual(Object.keys(nlValue).sort(), Object.keys(enValue).sort(), `${key}: plural forms`);
    }
    const enSet = [...new Set(texts(enValue).flatMap(placeholders))].sort();
    const nlSet = [...new Set(texts(nlValue).flatMap(placeholders))].sort();
    assert.deepEqual(nlSet, enSet, `${key}: placeholders`);
  }
});

test("setLanguage uses the base language, else English", () => {
  assert.equal(setLanguage("nl-NL"), "nl");
  assert.equal(getLanguage(), "nl");
  assert.equal(setLanguage("en-GB"), "en");
  assert.equal(setLanguage("NL"), "nl");
  assert.equal(setLanguage("fr"), "en");
  assert.equal(setLanguage(undefined), "en");
});

test("t looks up, fills placeholders and picks the plural form", () => {
  setLanguage("nl");
  assert.equal(t("tabs.cellar"), "Kelder");
  assert.equal(t("window.until", { year: 2029 }), "tot 2029");
  assert.equal(t("common.bottles", { count: 1 }), "1 fles");
  assert.equal(t("common.bottles", { count: 0 }), "0 flessen");
  assert.equal(t("common.bottles", { count: 3 }), "3 flessen");
  setLanguage("en");
  assert.equal(t("tabs.cellar"), "Cellar");
  assert.equal(t("common.bottles", { count: 1 }), "1 bottle");
  assert.equal(t("common.bottles", { count: 2 }), "2 bottles");
  assert.equal(t("rating.stars", { count: 0.5, value: "0.5" }), "0.5 stars");
});

test("t falls back to English, then to the key; unknown placeholders stay", () => {
  setLanguage("nl");
  const saved = TRANSLATIONS.nl.tabs.now;
  delete TRANSLATIONS.nl.tabs.now;
  try {
    assert.equal(t("tabs.now"), "Drink now");
  } finally {
    TRANSLATIONS.nl.tabs.now = saved;
  }
  assert.equal(t("no.such.key"), "no.such.key");
  assert.equal(t("tabs"), "tabs", "a group is not a text");
  assert.equal(t("window.until"), "tot {year}");
});

test("labels follow the language after import", async () => {
  const { STATUS_LABELS, WINE_TYPES } = await import("../src/logic/status.js");
  const { CHIPS } = await import("../src/logic/ranking.js");
  setLanguage("nl");
  assert.equal(STATUS_LABELS.ready, "Op dronk");
  assert.equal(WINE_TYPES[1], "Rood");
  assert.equal(CHIPS[0].label, "🥂 Borrelen");
  setLanguage("en");
  assert.equal(STATUS_LABELS.ready, "Ready");
  assert.equal(WINE_TYPES[1], "Red");
  assert.equal(CHIPS[0].label, "🥂 Drinks");
});

// Words the card used to hard-code in Dutch: they belong in translations/nl.json only.
const DUTCH = [
  "fles", "flessen", "wijn", "wijnen", "Ontkurken", "Ontkurkt", "Sluiten", "drinken", "Kelder",
  "Zoek", "Zoeken", "Annuleren", "Opslaan", "Laden", "vanaf", "tot", "sinds", "Voorbij",
  "beoordeling", "beoordelingen", "Jouw", "Onbekende", "Locatie", "vak", "Vernieuwen", "Nooit",
  "Bekijk", "Druiven", "Herkomst", "Soort", "Niets", "Opnieuw", "Borrelen", "Verfrissend",
  "Winteravond", "Moet op", "Iets", "Het is", "Waar heb je",
];

function jsFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "translations" ? [] : jsFiles(path);
    return entry.name.endsWith(".js") ? [path] : [];
  });
}

test("no Dutch text left in the card's source", () => {
  const pattern = new RegExp(`(?<![\\p{L}_])(${DUTCH.join("|")})(?![\\p{L}_])`, "iu");
  const hits = [];
  for (const file of jsFiles(SRC)) {
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((line, i) => {
        const m = line.match(pattern);
        if (m) hits.push(`${file.slice(SRC.length)}:${i + 1}: "${m[1]}" in ${line.trim()}`);
      });
  }
  assert.deepEqual(hits, []);
});
