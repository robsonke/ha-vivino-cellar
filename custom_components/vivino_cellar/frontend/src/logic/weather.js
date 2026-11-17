/** Suggest a mood chip from the current temperature of a weather entity. */
import { t } from "./i18n.js";

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

  if (celsius >= WARM_C) return { chip: "refreshing", text: t("weather.warm", { temp: shown }) };
  if (celsius <= COLD_C) return { chip: "winter_evening", text: t("weather.cold", { temp: shown }) };
  return null;
}
