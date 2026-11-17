// Made-up cellar for the README screenshots. No real cellar data.
const IMG = (kind) => new URL(`./bottle-${kind}.svg`, import.meta.url).href;
const KIND = { 1: "red", 2: "white", 3: "sparkling", 4: "rose", 7: "white", 24: "red" };

const LOCATIONS = { 1: "Kitchen rack", 2: "Basement", 3: "Wine fridge" };

let bottleSeq = 1000;
function wine(id, w) {
  const spots = w.spots || [[1, 1]];
  const bottles = spots.flatMap(([loc, n]) =>
    Array.from({ length: n }, () => {
      const bid = bottleSeq++;
      return {
        bottle_id: bid,
        id: bid,
        size_id: 1,
        storage_location_id: loc,
        location_name: LOCATIONS[loc],
        location_number: loc,
        bin: w.bin || null,
        created_at: "2025-03-01T12:00:00Z",
      };
    })
  );
  return {
    vintage_id: id,
    id,
    name: w.name,
    winery: w.winery,
    year: w.year,
    region: w.region,
    country: w.country,
    type_id: w.type,
    grapes: w.grapes,
    vivino_url: null,
    style: w.style,
    style_body: w.body,
    style_acidity: w.acidity,
    rating: w.rating,
    ratings_count: w.count,
    image_url: IMG(KIND[w.type]),
    start_year: w.start ?? null,
    end_year: w.end ?? null,
    window_source: "vivino",
    window_status: w.status,
    bottle_count: bottles.length,
    bottles,
    foods: (w.foods || []).map((f) => ({ id: f, name: "", seo_name: "", weight: 1 })),
  };
}

export const WINES = [
  wine(101, { name: "Colline Alte Riserva", winery: "Tenuta Valmora", year: 2016, region: "Chianti Classico", country: "Italy", type: 1, grapes: ["Sangiovese"], style: "Italian Chianti", body: 4, acidity: 3, rating: 4.2, count: 1843, start: 2021, end: 2026, status: "near_past_peak", spots: [[2, 2]], bin: "B3", foods: [4, 8] }),
  wine(102, { name: "Les Pierres Blanches", winery: "Domaine Arnaud-Leroux", year: 2021, region: "Chablis", country: "France", type: 2, grapes: ["Chardonnay"], style: "Burgundy Chablis", body: 2, acidity: 3, rating: 4.0, count: 2210, start: 2023, end: 2028, status: "ready", spots: [[3, 2]], foods: [11, 13] }),
  wine(103, { name: "Old Vine Garnacha", winery: "Bodegas Sierra Roja", year: 2019, region: "Priorat", country: "Spain", type: 1, grapes: ["Grenache", "Carignan"], style: "Spanish Priorat Red", body: 5, acidity: 2, rating: 4.4, count: 967, start: 2023, end: 2034, status: "can_wait", spots: [[2, 3]], bin: "A1", foods: [4, 6] }),
  wine(104, { name: "Brut Réserve", winery: "Maison Delacourt", year: null, region: "Champagne", country: "France", type: 3, grapes: ["Chardonnay", "Pinot Noir"], style: "Champagne", body: 2, acidity: 3, rating: 4.1, count: 5120, start: 2024, end: 2028, status: "ready", spots: [[3, 1]], foods: [11] }),
  wine(105, { name: "Grand Cru Hermitage", winery: "Cave de la Colline", year: 2020, region: "Hermitage", country: "France", type: 1, grapes: ["Syrah"], style: "Northern Rhône Syrah", body: 4, acidity: 3, rating: 4.5, count: 612, start: 2028, end: 2045, status: "hold", spots: [[2, 2]], bin: "C2", foods: [6] }),
  wine(106, { name: "Rosé de Provence", winery: "Château Saint-Clair", year: 2024, region: "Côtes de Provence", country: "France", type: 4, grapes: ["Grenache", "Cinsault"], style: "Provence Rosé", body: 2, acidity: 2, rating: 3.9, count: 3402, start: 2025, end: 2027, status: "near_past_peak", spots: [[1, 1], [3, 1]], foods: [13] }),
  wine(107, { name: "Spätlese Riesling", winery: "Weingut Hohenberg", year: 2018, region: "Mosel", country: "Germany", type: 2, grapes: ["Riesling"], style: "German Mosel Riesling", body: 2, acidity: 4, rating: 4.3, count: 1288, start: 2022, end: 2035, status: "can_wait", spots: [[2, 1]], foods: [9] }),
  wine(108, { name: "Reserva Malbec", winery: "Finca Los Andes", year: 2020, region: "Mendoza", country: "Argentina", type: 1, grapes: ["Malbec"], style: "Argentinian Malbec", body: 4, acidity: 2, rating: 4.0, count: 7820, start: 2022, end: 2029, status: "ready", spots: [[1, 2]], foods: [4] }),
  wine(109, { name: "Barolo Cannubi", winery: "Cascina Ferraro", year: 2010, region: "Barolo", country: "Italy", type: 1, grapes: ["Nebbiolo"], style: "Italian Barolo", body: 4, acidity: 4, rating: 4.3, count: 455, start: 2016, end: 2024, status: "past_peak", spots: [[2, 1]], foods: [6] }),
  wine(110, { name: "Sauvignon Blanc", winery: "Kōwhai Estate", year: 2024, region: "Marlborough", country: "New Zealand", type: 2, grapes: ["Sauvignon Blanc"], style: "New Zealand Sauvignon Blanc", body: 2, acidity: 4, rating: 3.8, count: 9100, status: "unknown", spots: [[3, 2]], foods: [11] }),
];

export const FOOD_CATEGORIES = [
  { id: 4, name: "Beef", seo_name: "beef" },
  { id: 6, name: "Lamb", seo_name: "lamb" },
  { id: 8, name: "Pasta", seo_name: "pasta" },
  { id: 9, name: "Spicy food", seo_name: "spicy-food" },
  { id: 11, name: "Shellfish", seo_name: "shellfish" },
  { id: 13, name: "Vegetarian", seo_name: "vegetarian" },
];

export function cellarPayload() {
  const order = ["near_past_peak", "ready", "can_wait", "hold", "past_peak", "unknown"];
  const grouped = Object.fromEntries(order.map((s) => [s, WINES.filter((w) => w.window_status === s)]));
  return {
    cellar_id: 1,
    settings: { title: "", now_limit: 5, weather_entity: null },
    total_bottles: WINES.reduce((n, w) => n + w.bottle_count, 0),
    last_refresh_time: new Date().toISOString(),
    last_update_success: true,
    food_categories: FOOD_CATEGORIES,
    wines: WINES,
    grouped_wines: grouped,
    status_counts: Object.fromEntries(order.map((s) => [s, grouped[s].reduce((n, w) => n + w.bottle_count, 0)])),
  };
}

export const PAIRING = {
  "truffle risotto with wild mushrooms": [
    { vintage_id: 109, explanation: "Nebbiolo's earthy notes mirror the truffle and mushrooms." },
    { vintage_id: 102, explanation: "Fresh Chablis cuts through the creamy risotto." },
    { vintage_id: 101, explanation: "Bright Sangiovese acidity lifts the parmesan." },
  ],
};
