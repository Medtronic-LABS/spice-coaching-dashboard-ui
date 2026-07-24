import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { apiBaseUrl } from '@/config/apiClientConfig';

export { apiBaseUrl } from '@/config/apiClientConfig';

const appBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = fetchBaseQuery({
  baseUrl: apiBaseUrl,
  credentials: 'include',
});

export const baseApi = createApi({
  reducerPath: 'baseApi',
  refetchOnMountOrArgChange: true,
  refetchOnFocus: true,
  baseQuery: appBaseQuery,
  tagTypes: ['Config', 'ModuleDomains'],
  endpoints: () => ({}),
});
