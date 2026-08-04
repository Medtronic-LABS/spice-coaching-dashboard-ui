import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { apiBaseUrl, useMockApi } from '@/config/apiClientConfig';
import { mockBaseQuery } from '@/store/apis/mockBaseQuery';
import { shouldUseRealFetchForRequest } from '@/store/apis/requestRouting';

export { apiBaseUrl } from '@/config/apiClientConfig';

const realFetchBaseQuery = fetchBaseQuery({
  baseUrl: apiBaseUrl,
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

/** Used by unit tests to verify mock vs real fetch routing outside vitest `MODE=test`. */
export const apiRequestBaseQuery = hybridBaseQuery;

export const baseApi = createApi({
  reducerPath: 'baseApi',
  refetchOnMountOrArgChange: true,
  refetchOnFocus: true,
  baseQuery: hybridBaseQuery,
  tagTypes: ['Config', 'ModuleDomains'],
  endpoints: () => ({}),
});
