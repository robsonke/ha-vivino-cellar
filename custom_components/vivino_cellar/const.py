"""Constants for the Vivino Cellar integration."""

DOMAIN = "vivino_cellar"

CONF_CELLAR_URL = "cellar_url"
CONF_COOKIE = "cookie"
CONF_AI_TASK = "ai_task"

# Services (Actions)
SERVICE_SUGGEST_PAIRING = "suggest_pairing"
SERVICE_DRINK_BOTTLE = "drink_bottle"
SERVICE_REFRESH = "refresh"

# Assist Voice Intent
INTENT_SUGGEST_WINE = "VivinoCellarSuggestWine"

# WebSocket API Commands
WS_TYPE_CELLAR = "vivino_cellar/cellar"
WS_TYPE_PAIRING = "vivino_cellar/pairing"
WS_TYPE_DRINK = "vivino_cellar/drink"
WS_TYPE_REFRESH = "vivino_cellar/refresh"
WS_TYPE_SUBSCRIBE = "vivino_cellar/subscribe"
