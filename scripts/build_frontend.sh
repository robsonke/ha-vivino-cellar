#!/usr/bin/env bash
# Bundle frontend/src (Lit included) into the single module HA serves.
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build
