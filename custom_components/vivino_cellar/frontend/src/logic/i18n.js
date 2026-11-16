/**
 * Card texts in the user's language: English (en) and Dutch (nl).
 * Texts live in ../translations/<lang>.json as nested objects; a plural text is
 * an object of Intl.PluralRules forms ({one, other}), chosen with params.count.
 */
import en from "../translations/en.json" with { type: "json" };
import nl from "../translations/nl.json" with { type: "json" };

export const TRANSLATIONS = { en, nl };
export const FALLBACK_LANGUAGE = "en";

const PLURAL_FORMS = new Set(["zero", "one", "two", "few", "many", "other"]);

let current = FALLBACK_LANGUAGE;
const listeners = new Set();

/** "nl", "nl-NL", "en-GB": use the base language if we have it, else English. */
export function setLanguage(lang) {
  const base = String(lang || "").toLowerCase().split(/[-_]/)[0];
  const next = Object.hasOwn(TRANSLATIONS, base) ? base : FALLBACK_LANGUAGE;
  if (next !== current) {
    current = next;
    for (const fn of listeners) fn(current);
  }
  return current;
}

export function getLanguage() {
  return current;
}

/** Call `fn(lang)` whenever the language changes; returns the unsubscribe. */
export function onLanguageChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function isPlural(value) {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    "other" in value &&
    Object.keys(value).every((k) => PLURAL_FORMS.has(k))
  );
}

function lookup(table, key) {
  let node = table;
  for (const part of key.split(".")) {
    if (!node || typeof node !== "object" || !Object.hasOwn(node, part)) return undefined;
    node = node[part];
  }
  return typeof node === "string" || isPlural(node) ? node : undefined;
}

/** The text for `key` in the current language, else English, else the key itself. */
export function t(key, params = {}) {
  let lang = current;
  let value = lookup(TRANSLATIONS[lang], key);
  if (value === undefined && lang !== FALLBACK_LANGUAGE) {
    lang = FALLBACK_LANGUAGE;
    value = lookup(TRANSLATIONS[lang], key);
  }
  if (value === undefined) return key;
  if (typeof value === "object") {
    const form = new Intl.PluralRules(lang).select(Number(params.count ?? 0));
    value = value[form] ?? value.other;
  }
  return value.replace(/\{(\w+)\}/g, (match, name) =>
    Object.hasOwn(params, name) && params[name] !== undefined && params[name] !== null
      ? String(params[name])
      : match
  );
}

/** A number with one decimal in the current language: 3.5 -> "3,5" (nl), "3.5" (en). */
export function formatDecimal(value) {
  return new Intl.NumberFormat(current, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
}
