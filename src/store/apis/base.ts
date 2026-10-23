import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { apiBaseUrl } from '@/config/apiClientConfig';
import { serializeRepeatedQueryParams } from '@/store/apis/serializeQueryParams';

export { apiBaseUrl } from '@/config/apiClientConfig';

const realFetchBaseQuery = fetchBaseQuery({
  baseUrl: apiBaseUrl,
  credentials: 'include',
  paramsSerializer: serializeRepeatedQueryParams,
});

const apiRequestBaseQueryImpl: BaseQueryFn = async (
  args,
  api,
  extraOptions,
) => {
  return realFetchBaseQuery(args, api, extraOptions);
};

/** Exported for unit tests that stub network behavior. */
export const apiRequestBaseQuery = apiRequestBaseQueryImpl;

export const baseApi = createApi({
  reducerPath: 'baseApi',
  refetchOnMountOrArgChange: true,
  refetchOnFocus: true,
  baseQuery: apiRequestBaseQueryImpl,
  tagTypes: [
    'Config',
    'ConfigHistory',
    'ModuleDomains',
    'SourceDocuments',
    'Badges',
  ],
  endpoints: () => ({}),
});
