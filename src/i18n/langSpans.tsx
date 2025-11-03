// src/i18n/langSpans.tsx

/**
 * Normalize a language code to its base (e.g., "es-MX" -> "es") with a fallback.
 */
export function getActiveBaseLang(lang?: string | null, fallback = "en"): string {
  const l = (lang || fallback).toLowerCase();
  return (l.includes("-") ? l.split("-")[0] : l) || fallback;
}

/** Quick check: does a string contain <span lang="..."> ? */
export function hasLangSpans(s: unknown): s is string {
  return typeof s === "string" && /<span\s+lang\s*=/i.test(s);
}

/**
 * Extract INNER HTML for the best-matching <span lang="..."> block.
 * Use for rich fields like "description" where you want to preserve <p>, <br>, etc.
 */
export function extractLangHTML(
  htmlString: string,
  lang: string,
  fallback: string = "en"
): string {
  if (!htmlString) return "";
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");

  const base = getActiveBaseLang(lang);
  const fb = getActiveBaseLang(fallback);

  const trySelectors = [
    `span[lang="${lang}"]`,
    base !== lang ? `span[lang="${base}"]` : "",
    fb ? `span[lang="${fb}"]` : "",
  ].filter(Boolean);

  for (const sel of trySelectors) {
    const el = doc.querySelector(sel);
    if (el) return (el as HTMLElement).innerHTML.trim();
  }

  const first = doc.querySelector("span[lang]");
  if (first) return (first as HTMLElement).innerHTML.trim();

  // If there were spans but no match, fall back to original string (already HTML)
  return (htmlString || "").trim();
}

/**
 * Extract PLAIN TEXT for the best-matching <span lang="..."> block.
 * Use for label-like fields (name, alias, units, category) so no HTML slips in.
 */
export function extractLangText(
  htmlString: string,
  lang: string,
  fallback: string = "en"
): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString || "", "text/html");

  const base = getActiveBaseLang(lang);
  const fb = getActiveBaseLang(fallback);

  const trySelectors = [
    `span[lang="${lang}"]`,
    base !== lang ? `span[lang="${base}"]` : "",
    fb ? `span[lang="${fb}"]` : "",
  ].filter(Boolean);

  for (const sel of trySelectors) {
    const el = doc.querySelector(sel);
    if (el) return (el.textContent || "").trim();
  }

  const first = doc.querySelector("span[lang]");
  if (first) return (first.textContent || "").trim();

  // Last resort: visible text of the whole string
  return (doc.body.textContent || htmlString || "").trim();
}

/**
 * Recursively localize ALL string fields that contain <span lang="...">.
 *
 * - For keys listed in `htmlKeys` (default: ["description"]), we keep HTML via `extractLangHTML`.
 * - For any other string that contains spans, we return plain text via `extractLangText`.
 * - Strings WITHOUT spans are returned unchanged.
 * - Non-strings are untouched.
 */
export function localizeAllStrings<T>(
  data: T,
  lang: string,
  htmlKeys: string[] = ["description"],
  fallback: string = "en"
): T {
  const visit = (node: any): any => {
    if (Array.isArray(node)) {
      return node.map(visit);
    }
    if (node && typeof node === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(node)) {
        if (typeof v === "string" && hasLangSpans(v)) {
          out[k] = htmlKeys.includes(k)
            ? extractLangHTML(v, lang, fallback)   // preserve markup for rich fields
            : extractLangText(v, lang, fallback);  // labels -> plain text
        } else if (v && typeof v === "object") {
          out[k] = visit(v);
        } else {
          out[k] = v;
        }
      }
      return out;
    }
    return node;
  };

  return visit(data);
}

/**
 * Convenience helper: localize on already-fetched JSON using current i18n state.
 * Pass your i18n instance (or a lookalike) to avoid import cycles.
 */
export function localizeWithI18n<T>(
  data: T,
  i18nLike: { language?: string; resolvedLanguage?: string },
  htmlKeys: string[] = ["description"],
  fallback = "en"
): T {
  const lang = getActiveBaseLang(i18nLike.resolvedLanguage || i18nLike.language || fallback, fallback);
  return localizeAllStrings(data, lang, htmlKeys, fallback);
}
