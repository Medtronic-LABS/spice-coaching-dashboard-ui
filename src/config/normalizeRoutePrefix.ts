/** Default SPA path prefix when `VITE_ROUTE_PREFIX` is unset. */
export const DEFAULT_ROUTE_PREFIX = '/ai-coaching';

/**
 * Normalize a route prefix from env: leading slash, no trailing slash.
 * Examples: `ai-coaching` → `/ai-coaching`, `/ai-coaching/` → `/ai-coaching`
 */
export function normalizeRoutePrefix(raw: string | undefined): string {
  if (typeof raw !== 'string') return DEFAULT_ROUTE_PREFIX;

  const trimmed = raw.trim();
  if (trimmed.length === 0) return DEFAULT_ROUTE_PREFIX;

  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const withoutTrailingSlash = withLeadingSlash.replace(/\/+$/, '');

  return withoutTrailingSlash.length > 0
    ? withoutTrailingSlash
    : DEFAULT_ROUTE_PREFIX;
}
