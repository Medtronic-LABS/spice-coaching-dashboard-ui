import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { mockBaseQuery } from '@/store/apis/mockBaseQuery';

/**
 * Selects the RTK Query base query based on `VITE_USE_MOCK_API`.
 * When `true` (or unset in test mode), all baseApi endpoints are served by
 * the in-process mock. When `false`, requests go to `VITE_API_BASE_URL`
 * (or `/api/v1` as a final fallback).
 */
const useMock = import.meta.env.VITE_USE_MOCK_API === 'true';

const baseQuery = useMock
  ? mockBaseQuery
  : fetchBaseQuery({
      baseUrl: import.meta.env.VITE_API_BASE_URL || '/api/v1',
      credentials: 'include',
    });

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery,
  endpoints: () => ({}),
});
