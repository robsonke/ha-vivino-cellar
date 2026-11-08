"""Exceptions for Vivino Cellar integration."""

try:
    from homeassistant.exceptions import HomeAssistantError
except ImportError:
    # Fallback when running tests without homeassistant installed
    class HomeAssistantError(Exception):
        """Fallback base exception for Home Assistant."""


class VivinoError(HomeAssistantError):
    """Base exception for Vivino Cellar errors."""


class VivinoAuthError(VivinoError):
    """Raised when authentication fails or session cookie has expired."""


class VivinoParseError(VivinoError):
    """Raised when Vivino HTML or Inertia response cannot be parsed."""


class VivinoConnectionError(VivinoError):
    """Raised when network connection to Vivino fails."""
