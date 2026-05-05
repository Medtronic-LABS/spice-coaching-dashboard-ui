import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

function normalizeBaseUrl(baseUrl: string): string {
  if (!baseUrl) return '';
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

const defaultBaseUrl = 'http://192.168.5.121:8001';
const baseUrl = normalizeBaseUrl(
  import.meta.env.VITE_ADMIN_API_BASE_URL || defaultBaseUrl,
);

/** Module-creation pipeline can run many minutes; avoid client-side fetch timeouts. */
const LONG_RUNNING_MS = 20 * 60 * 1000;

export const adminBaseApi = createApi({
  reducerPath: 'adminBaseApi',
  baseQuery: fetchBaseQuery({
    baseUrl,
    timeout: LONG_RUNNING_MS,
  }),
  endpoints: () => ({}),
});
