/**
 * Status colours (the only fixed colours in the card), light and dark.
 * Tested for WCAG AA (4.5:1) as badge text on their own tint (test/colors.test.js).
 */
export const STATUS_COLORS = {
  light: {
    near_past_peak: "#8e5500",
    ready: "#29702d",
    can_wait: "#006f62",
    hold: "#1461b8",
    past_peak: "#ba2626",
    unknown: "#626262",
  },
  dark: {
    near_past_peak: "#ffb74d",
    ready: "#81c784",
    can_wait: "#5bbcb3",
    hold: "#64b5f6",
    past_peak: "#f5918f",
    unknown: "#aeaeae",
  },
};

/** Badge/pill background = status colour at this opacity over the surface. */
export const TINT = { light: 0.12, dark: 0.18 };

export const TOAST_ERROR_BG = "#c62828";
