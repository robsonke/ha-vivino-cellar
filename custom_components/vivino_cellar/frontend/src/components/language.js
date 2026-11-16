/** Re-render an element when the card language changes (its own properties may not). */
import { onLanguageChange } from "../logic/i18n.js";

export class LanguageController {
  constructor(host) {
    this.host = host;
    host.addController(this);
  }

  hostConnected() {
    this._off = onLanguageChange(() => this.host.requestUpdate());
  }

  hostDisconnected() {
    this._off?.();
    this._off = null;
  }
}
