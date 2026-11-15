/** Small helpers shared by the card's logic and components. */

/** Only http(s) links (protocol-relative becomes https); anything else is dropped. */
export function safeUrl(url) {
  if (!url) return null;
  const full = String(url).startsWith("//") ? `https:${url}` : String(url);
  return /^https?:\/\//i.test(full) ? full : null;
}

export function bottleId(bottle) {
  return bottle.bottle_id ?? bottle.id;
}

export function vintageId(wine) {
  return wine.vintage_id ?? wine.id;
}

/** Group bottles by location + bin: [{location, bin, bottles}]. */
export function bottleSpots(bottles) {
  const spots = new Map();
  for (const b of bottles || []) {
    const location = b.location_name || "Kelder";
    const bin = b.bin || null;
    const key = JSON.stringify([location, bin]);
    if (!spots.has(key)) spots.set(key, { location, bin, bottles: [] });
    spots.get(key).bottles.push(b);
  }
  return [...spots.values()];
}

/** 3.5 -> "3,5"; null -> "". */
export function formatRating(value) {
  return typeof value === "number" ? value.toFixed(1).replace(".", ",") : "";
}

/** Copies of the wines with bottles that have a pending (undoable) drink removed. */
export function viewWines(wines, pendingIds) {
  return (wines || []).map((wine) => {
    const bottles = (wine.bottles || []).filter((b) => !pendingIds.has(bottleId(b)));
    return { ...wine, bottles, bottle_count: bottles.length };
  });
}
