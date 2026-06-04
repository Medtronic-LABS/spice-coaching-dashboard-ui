import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { mockBaseQuery } from '@/store/apis/mockBaseQuery';
import { shouldUseRealFetchForRequest } from '@/store/apis/requestRouting';

function normalizeBaseUrl(baseUrl: string): string {
  if (!baseUrl) return '';
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

const defaultApiBaseUrl = 'https://agent-qa.beehyv.com/medtronics-api';

/** API origin (no trailing slash). Use for absolute URLs e.g. file downloads, `EventSource`. */
export const apiBaseUrl = normalizeBaseUrl(
  import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl,
);

/** Shared headers for all API requests. */
export const apiCommonHeaders = {
  'X-Reviewer-Id': '00000000-0000-0000-0000-000000000001',
  'X-Reviewer-Token': 'dev-reviewer-token',
};

const useMockApi =
  import.meta.env.MODE === 'test' ||
  import.meta.env.VITE_USE_MOCK_API !== 'false';

const realFetchBaseQuery = fetchBaseQuery({
  baseUrl: apiBaseUrl,
  headers: apiCommonHeaders,
  // credentials: 'include',
});

const hybridBaseQuery: BaseQueryFn = (args, api, extraOptions) => {
  if (import.meta.env.MODE === 'test') {
    return mockBaseQuery(args, api, extraOptions);
  }
  if (!useMockApi || shouldUseRealFetchForRequest(args)) {
    return realFetchBaseQuery(args, api, extraOptions);
  }
  return mockBaseQuery(args, api, extraOptions);
};

export const baseApi = createApi({
  reducerPath: 'baseApi',
  refetchOnMountOrArgChange: true,
  refetchOnFocus: true,
  baseQuery: hybridBaseQuery,
  endpoints: () => ({}),
});
