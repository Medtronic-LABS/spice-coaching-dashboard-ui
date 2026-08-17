/**
 * Pull only the AuthCookie value from a SPICE/session Authorization header.
 *
 * Example input:
 *   JSESSIONID=abcd;Path=/;HttpOnly,AuthCookie=efg;Path=/
 * → efg
 */
export function normalizeAuthCookieValue(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;

  // Prefer AuthCookie=... (case-insensitive), including comma-joined cookie lists.
  const authCookieMatch = /(?:^|[,;]\s*)AuthCookie=([^;,]+)/i.exec(trimmed);
  if (authCookieMatch?.[1]) {
    return authCookieMatch[1].trim();
  }

  // Legacy auth-cookie=... Set-Cookie style
  const firstPair = trimmed.split(';', 1)[0]?.trim() ?? trimmed;
  if (firstPair.toLowerCase().startsWith('auth-cookie=')) {
    return firstPair.slice('auth-cookie='.length).trim();
  }

  return trimmed;
}

/** Read the session AuthCookie value from a fetch Response (case-insensitive). */
export function extractAuthCookieFromResponseHeaders(
  headers: Headers | undefined | null,
): string | undefined {
  if (!headers) return undefined;

  const candidates = [
    headers.get('authorization'),
    headers.get('Authorization'),
    headers.get('auth-cookie'),
    headers.get('Auth-Cookie'),
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      const normalized = normalizeAuthCookieValue(candidate);
      if (normalized) return normalized;
    }
  }
  return undefined;
}
