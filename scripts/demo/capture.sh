#!/usr/bin/env bash
# Regenerates the README screenshots in docs/images from the demo page.
# Needs Google Chrome and uv. Run from the repo root: scripts/demo/capture.sh
set -euo pipefail

CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
PORT=8765
OUT=docs/images
mkdir -p "$OUT"

python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER' EXIT
sleep 1

shot() { # name, query, height
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
    --window-size=520,"$3" --virtual-time-budget=4000 \
    --screenshot="$OUT/$1.png" "http://127.0.0.1:$PORT/scripts/demo/?$2" 2>/dev/null
}

shot now "tab=now" 1000
shot now-dark "tab=now&dark=1" 1000
shot pairing "tab=pairing&dish=Truffle%20risotto%20with%20wild%20mushrooms" 1000
shot cellar "tab=cellar" 1400
shot detail "tab=now&detail=101" 820

# Trim the empty page background around the card (dialogs keep the full frame).
uv run --quiet --with pillow python3 - "$OUT" <<'EOF'
import sys
from pathlib import Path
from PIL import Image, ImageChops

for path in Path(sys.argv[1]).glob("*.png"):
    if path.stem == "detail":
        continue
    img = Image.open(path).convert("RGB")
    bg = Image.new("RGB", img.size, img.getpixel((2, 2)))
    box = ImageChops.difference(img, bg).getbbox()
    if box:
        pad = 24
        img.crop((max(box[0] - pad, 0), max(box[1] - pad, 0),
                  min(box[2] + pad, img.width), min(box[3] + pad, img.height))).save(path, optimize=True)
EOF
ls -la "$OUT"
