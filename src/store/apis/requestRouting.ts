import type { FetchArgs } from '@reduxjs/toolkit/query';

/** Normalize RTK Query URL (no leading slash) for routing decisions. */
export function getNormalizedRequestUrl(args: string | FetchArgs): string {
  const raw = typeof args === 'string' ? args : args.url;
  return raw.startsWith('/') ? raw.slice(1) : raw;
}

/**
 * Admin module, ingest, file upload, and pipeline endpoints should use the real
 * network even when dashboard mocks are enabled (`VITE_USE_MOCK_API=true`).
 */
export function shouldUseRealFetchForRequest(
  args: string | FetchArgs,
): boolean {
  const url = getNormalizedRequestUrl(args);
  return url.startsWith('admin/');
}
