/** Fire a `vc-*` event that crosses shadow roots up to the root card. */
export function fire(el, type, detail = {}) {
  el.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
}
