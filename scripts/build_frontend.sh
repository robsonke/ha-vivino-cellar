#!/usr/bin/env bash
# Bundle frontend/src into the single module HA serves: styles.js + card (minus its import).
set -euo pipefail
dir="$(cd "$(dirname "$0")/../custom_components/vivino_cellar/frontend" && pwd)"
{
  printf '/**\n * Vivino Cellar Custom Lovelace Card and Sidebar Panel Component.\n */\n\n'
  cat "$dir/src/styles.js"
  sed -e '1,/^import /d' "$dir/src/vivino-cellar-card.js"
} > "$dir/vivino-cellar-card.js"
echo "Built $dir/vivino-cellar-card.js"
