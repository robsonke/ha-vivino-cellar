import { test } from "node:test";
import assert from "node:assert/strict";

import { STATUS_COLORS, TINT, TOAST_ERROR_BG } from "../src/logic/colors.js";

// WCAG 2.x relative luminance and contrast
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const lum = ([r, g, b]) =>
  [r, g, b]
    .map((c) => c / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    .reduce((acc, c, i) => acc + c * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
// color-mix(in srgb, colour t%, transparent) drawn over a surface
const tintOver = (color, surface, t) => rgb(color).map((c, i) => Math.round(c * t + surface[i] * (1 - t)));

// HA default surfaces a badge or pill can sit on
const SURFACES = {
  light: ["#ffffff", "#f5f5f5"],
  dark: ["#1c1c1c", "#282828"],
};

for (const theme of ["light", "dark"]) {
  for (const [status, color] of Object.entries(STATUS_COLORS[theme])) {
    test(`${theme} ${status} text passes AA on its tint`, () => {
      for (const surface of SURFACES[theme]) {
        const bg = tintOver(color, rgb(surface), TINT[theme]);
        const ratio = contrast(rgb(color), bg);
        assert.ok(ratio >= 4.5, `${color} on ${surface}+tint: ${ratio.toFixed(2)}`);
      }
    });
  }
}

test("white text on the error toast passes AA", () => {
  const ratio = contrast([255, 255, 255], rgb(TOAST_ERROR_BG));
  assert.ok(ratio >= 4.5, ratio.toFixed(2));
});
