"""Drinking window calculation engine for Vivino Cellar."""

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .models import Vintage

WINDOW_STATUS_HOLD = "hold"
WINDOW_STATUS_READY = "ready"
WINDOW_STATUS_CAN_WAIT = "can_wait"
WINDOW_STATUS_NEAR_PAST_PEAK = "near_past_peak"
WINDOW_STATUS_PAST_PEAK = "past_peak"
WINDOW_STATUS_UNKNOWN = "unknown"

# Ready wines whose window ends this many years out or later can still wait.
CAN_WAIT_YEARS = 5


def compute_window_status(
    start_year: int | None,
    end_year: int | None,
    current_year: int,
) -> str:
    """Compute the drinking window status from start year, end year, and current year.

    Status logic:
    - unknown: start_year or end_year is None
    - hold: start_year > current_year
    - near_past_peak: end_year == current_year
    - can_wait: ready, and end_year is CAN_WAIT_YEARS or more from now
    - ready: start_year <= current_year < end_year
    - past_peak: end_year < current_year
    """
    if start_year is None or end_year is None:
        return WINDOW_STATUS_UNKNOWN
    if start_year > current_year:
        return WINDOW_STATUS_HOLD
    if end_year == current_year:
        return WINDOW_STATUS_NEAR_PAST_PEAK
    if start_year <= current_year < end_year:
        if end_year - current_year >= CAN_WAIT_YEARS:
            return WINDOW_STATUS_CAN_WAIT
        return WINDOW_STATUS_READY
    if end_year < current_year:
        return WINDOW_STATUS_PAST_PEAK
    return WINDOW_STATUS_UNKNOWN


def compute_vintage_window_status(vintage: "Vintage", current_year: int) -> str:
    """Compute drinking window status for a Vintage model instance."""
    return compute_window_status(vintage.start_year, vintage.end_year, current_year)
