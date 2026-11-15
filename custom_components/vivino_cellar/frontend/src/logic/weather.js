/** Suggest a mood chip from the current temperature of a weather entity. */

const WARM_C = 24;
const COLD_C = 8;

export function weatherSuggestion(hass, entityId) {
  if (!hass || !entityId) return null;
  const raw = hass.states?.[entityId]?.attributes?.temperature;
  const temp = typeof raw === "number" ? raw : Number.parseFloat(raw);
  if (!Number.isFinite(temp)) return null;

  const fahrenheit = hass.config?.unit_system?.temperature === "°F";
  const celsius = fahrenheit ? ((temp - 32) * 5) / 9 : temp;
  const shown = Math.round(temp);

  if (celsius >= WARM_C) return { chip: "verfrissend", text: `☀️ Het is ${shown}°. Iets fris?` };
  if (celsius <= COLD_C) return { chip: "winteravond", text: `❄️ Het is ${shown}°. Iets voor bij de haard?` };
  return null;
}
