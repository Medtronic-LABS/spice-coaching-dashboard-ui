const ALLOWED_HREF_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

function isRelativeHref(href: string): boolean {
  return (
    href.startsWith('/') ||
    href.startsWith('#') ||
    href.startsWith('./') ||
    href.startsWith('../')
  );
}

/** Returns a safe href for storage, or null when the URL must be dropped. */
export function normalizeHref(rawHref: string): string | null {
  const href = rawHref.trim();
  if (!href) return null;
  if (isRelativeHref(href)) return href;

  try {
    const url = new URL(href);
    if (!ALLOWED_HREF_PROTOCOLS.has(url.protocol)) return null;
    return href;
  } catch {
    return null;
  }
}

/** Escapes a string for safe use inside an HTML attribute value. */
export function escapeHtmlAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

/** Returns an attribute-safe href, or null when the URL must not be rendered. */
export function sanitizeHrefForHtml(rawHref: string): string | null {
  const normalized = normalizeHref(rawHref);
  if (!normalized) return null;
  return escapeHtmlAttribute(normalized);
}
