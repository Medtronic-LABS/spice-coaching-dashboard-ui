import type { FetchArgs } from '@reduxjs/toolkit/query';
import {
  isSpiceAdminServiceRequest,
  isSpiceUserServiceRequest,
} from '@/config/spiceConfig';

/** Normalize RTK Query URL (no leading slash) for routing decisions. */
export function getNormalizedRequestUrl(args: string | FetchArgs): string {
  const raw = typeof args === 'string' ? args : args.url;
  return raw.startsWith('/') ? raw.slice(1) : raw;
}

/**
 * Admin module, ingest, file upload, pipeline, and SPICE admin/user-service
 * assignment picker endpoints should use the real network even when dashboard
 * mocks are enabled (`VITE_USE_MOCK_API=true`).
 */
export function shouldUseRealFetchForRequest(
  args: string | FetchArgs,
): boolean {
  const url = getNormalizedRequestUrl(args);
  return (
    url.startsWith('admin/') ||
    isSpiceAdminServiceRequest(url) ||
    isSpiceUserServiceRequest(url)
  );
}
