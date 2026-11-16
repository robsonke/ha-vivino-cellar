"""Data models for Vivino Cellar."""

from dataclasses import dataclass


@dataclass(slots=True)
class Bottle:
    """Represents a physical bottle in the cellar."""

    id: int
    size_id: int
    storage_location_id: int | None
    location_name: str
    bin: str | None
    created_at: str
    # 1-based number of the storage location, for unnamed ones; set by locations.py
    location_number: int | None = None


@dataclass(slots=True)
class FoodCategory:
    """Represents a Vivino food category for wine pairing."""

    id: int
    name: str
    seo_name: str
    weight: float


@dataclass(slots=True)
class WineStyle:
    """Represents the style characteristics of a wine."""

    name: str
    body: float | None
    acidity: float | None
    food: list[str]


@dataclass(slots=True)
class Vintage:
    """Represents a specific vintage of a wine in the cellar."""

    id: int
    year: int | None
    name: str
    winery: str
    region: str
    country: str
    type_id: int
    grapes: list[str]
    image_url: str | None
    rating: float | None
    ratings_count: int
    foods: list[FoodCategory]
    style: WineStyle | None
    bottles: list[Bottle]
    start_year: int | None
    end_year: int | None
    window_source: str
    wine_id: int | None = (
        None  # Vivino wine (all vintages); used for the wine page link
    )


@dataclass(slots=True)
class CellarData:
    """Aggregated cellar data including all vintages and food categories."""

    cellar_id: str
    locale: str
    total_count: int
    vintages: list[Vintage]
    food_categories: list[FoodCategory]
