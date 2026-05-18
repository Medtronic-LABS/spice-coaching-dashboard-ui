import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { mockBaseQuery } from '@/store/apis/mockBaseQuery';

function normalizeBaseUrl(baseUrl: string): string {
  if (!baseUrl) return '';
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

const defaultBaseUrl = 'http://127.0.0.1:8000';

/**
 * Custom headers for all admin requests.
 * X-Reviewer-Id identifies the reviewer for tracking.
 * Both values come from environment variables; deployments MUST set real values
 * before publishing — the defaults are empty strings so requests fail loudly
 * rather than silently authenticating as a development placeholder.
 */
export const adminApiCommonHeaders = {
  'X-Reviewer-Id': import.meta.env.VITE_ADMIN_REVIEWER_ID || '',
  'X-Reviewer-Token': import.meta.env.VITE_ADMIN_REVIEWER_TOKEN || '',
};

/** Normalized admin API origin (no trailing slash). Use for absolute URLs e.g. `EventSource`. */
export const adminApiBaseUrl = normalizeBaseUrl(
  import.meta.env.VITE_ADMIN_API_BASE_URL || defaultBaseUrl,
);
const baseUrl = adminApiBaseUrl;

/** Module-creation pipeline can run many minutes; avoid client-side fetch timeouts. */
const LONG_RUNNING_MS = 20 * 60 * 1000;

export const adminBaseApi = createApi({
  reducerPath: 'adminBaseApi',
  tagTypes: ['ModulesQueue', 'ModuleCandidate'],
  baseQuery:
    import.meta.env.MODE === 'test'
      ? mockBaseQuery
      : fetchBaseQuery({
          baseUrl,
          timeout: LONG_RUNNING_MS,
          headers: adminApiCommonHeaders,
        }),
  endpoints: () => ({}),
});
