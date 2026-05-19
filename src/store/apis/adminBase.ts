import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { mockBaseQuery } from '@/store/apis/mockBaseQuery';

function normalizeBaseUrl(baseUrl: string): string {
  if (!baseUrl) return '';
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

const defaultBaseUrl = 'https://agent-qa.beehyv.com/medtronics-api';

/**
 * Custom headers for all admin requests.
 * X-Reviewer-Id identifies the reviewer for tracking.
 */
export const adminApiCommonHeaders = {
  'X-Reviewer-Id': '00000000-0000-0000-0000-000000000001',
  'X-Reviewer-Token': 'dev-reviewer-token',
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
  /** Fresh data by default; opt out per-hook with `refetchOnMountOrArgChange: false` (see `useAdminModuleDetailQuery` `useCache`). */
  refetchOnMountOrArgChange: true,
  refetchOnFocus: true,
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
