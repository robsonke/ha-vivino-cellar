"""Storage locations.

Vivino's web data gives each bottle only a storage_location_id. The user names
locations on the integration's Configure screen. Unnamed ones get a number;
the card and the voice intent turn that number into text in the user's language.
"""

from __future__ import annotations

from collections import Counter

from .models import CellarData


def location_counts(data: CellarData | None) -> dict[int, int]:
    """Bottles per storage location id, sorted by id."""
    counts: Counter[int] = Counter()
    for vintage in data.vintages if data else []:
        for bottle in vintage.bottles:
            if bottle.storage_location_id is not None:
                counts[bottle.storage_location_id] += 1
    return dict(sorted(counts.items()))


def apply_location_names(data: CellarData, names: dict[str, str]) -> None:
    """Set every bottle's location_name and location_number.

    location_name: the user's name, else Vivino's name, else empty.
    location_number: 1-based position of the location id, None without one.
    """
    numbers = {loc_id: n for n, loc_id in enumerate(location_counts(data), start=1)}
    for vintage in data.vintages:
        for bottle in vintage.bottles:
            loc_id = bottle.storage_location_id
            if loc_id is None:
                bottle.location_number = None
                continue
            chosen = (names.get(str(loc_id)) or "").strip()
            bottle.location_name = chosen or bottle.location_name or ""
            bottle.location_number = numbers[loc_id]
