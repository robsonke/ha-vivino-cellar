"""Storage location names.

Vivino's web data gives each bottle only a storage_location_id. The user names
locations on the integration's Configure screen; unnamed ones are numbered.
"""

from __future__ import annotations

from collections import Counter

from .models import CellarData

UNKNOWN_LOCATION = "Onbekende locatie"


def location_counts(data: CellarData | None) -> dict[int, int]:
    """Bottles per storage location id, sorted by id."""
    counts: Counter[int] = Counter()
    for vintage in data.vintages if data else []:
        for bottle in vintage.bottles:
            if bottle.storage_location_id is not None:
                counts[bottle.storage_location_id] += 1
    return dict(sorted(counts.items()))


def apply_location_names(data: CellarData, names: dict[str, str]) -> None:
    """Set every bottle's location_name: user name, Vivino name, or 'Locatie N'."""
    numbers = {loc_id: n for n, loc_id in enumerate(location_counts(data), start=1)}
    for vintage in data.vintages:
        for bottle in vintage.bottles:
            loc_id = bottle.storage_location_id
            if loc_id is None:
                bottle.location_name = bottle.location_name or UNKNOWN_LOCATION
                continue
            chosen = (names.get(str(loc_id)) or "").strip()
            bottle.location_name = (
                chosen or bottle.location_name or f"Locatie {numbers[loc_id]}"
            )
