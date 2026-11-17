import { test } from "node:test";
import assert from "node:assert/strict";

import { setLanguage } from "../src/logic/i18n.js";

setLanguage("nl"); // these tests pin the Dutch texts the card showed before i18n

import { weatherSuggestion } from "../src/logic/weather.js";

const hass = (temperature, unit = "°C") => ({
  config: { unit_system: { temperature: unit } },
  states: { "weather.home": { state: "sunny", attributes: { temperature } } },
});

test("warm suggests Verfrissend", () => {
  assert.deepEqual(weatherSuggestion(hass(27), "weather.home"), {
    chip: "refreshing",
    text: "☀️ Het is 27°. Iets fris?",
  });
  assert.equal(weatherSuggestion(hass(24), "weather.home").chip, "refreshing");
});

test("cold suggests Winteravond", () => {
  assert.deepEqual(weatherSuggestion(hass(5.4), "weather.home"), {
    chip: "winter_evening",
    text: "❄️ Het is 5°. Iets voor bij de haard?",
  });
  assert.equal(weatherSuggestion(hass(8), "weather.home").chip, "winter_evening");
});

test("mild weather: no suggestion", () => {
  assert.equal(weatherSuggestion(hass(15), "weather.home"), null);
});

test("Fahrenheit is converted for the thresholds but shown as-is", () => {
  const s = weatherSuggestion(hass(80, "°F"), "weather.home");
  assert.equal(s.chip, "refreshing");
  assert.equal(s.text, "☀️ Het is 80°. Iets fris?");
  assert.equal(weatherSuggestion(hass(60, "°F"), "weather.home"), null);
});

test("missing or broken weather data: no suggestion", () => {
  assert.equal(weatherSuggestion(hass(27), null), null);
  assert.equal(weatherSuggestion(hass(27), "weather.other"), null);
  assert.equal(weatherSuggestion(hass("unknown"), "weather.home"), null);
  assert.equal(weatherSuggestion(hass(undefined), "weather.home"), null);
  assert.equal(weatherSuggestion(null, "weather.home"), null);
});
