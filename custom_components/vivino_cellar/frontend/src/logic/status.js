/** Drinking-window statuses, labels and wine types. */

export const STATUS_ORDER = ["near_past_peak", "ready", "can_wait", "hold", "past_peak", "unknown"];

export const STATUS_LABELS = {
  near_past_peak: "Binnenkort drinken",
  ready: "Op dronk",
  can_wait: "Kan nog liggen",
  hold: "Nog wegleggen",
  past_peak: "Voorbij piek",
  unknown: "Venster onbekend",
};

export const WINE_TYPES = {
  1: "Rood",
  2: "Wit",
  3: "Mousserend",
  4: "Rosé",
  7: "Dessert",
  24: "Versterkt",
};

/** One-line reason shown on the top pick. */
export function reasonLine(wine, year) {
  const end = wine.end_year;
  switch (wine.window_status) {
    case "near_past_peak":
      return `Laatste jaar: drink in ${end ?? year}`;
    case "ready":
      return end ? `Op dronk tot ${end}` : "Op dronk";
    case "can_wait":
      return end ? `Kan nog liggen tot ${end}, mag ook nu` : "Kan nog liggen, mag ook nu";
    case "past_peak":
      return end ? `Voorbij de piek sinds ${end}: snel open` : "Voorbij de piek: snel open";
    case "hold":
      return wine.start_year ? `Nog wegleggen tot ${wine.start_year}` : "Nog wegleggen";
    default:
      return "Drinkvenster onbekend";
  }
}
