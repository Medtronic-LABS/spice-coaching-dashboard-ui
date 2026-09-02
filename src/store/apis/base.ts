import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { apiBaseUrl } from '@/config/apiClientConfig';
import { getAuthSession } from '@/features/auth/services/authSession';
import { serializeRepeatedQueryParams } from '@/store/apis/serializeQueryParams';

export { apiBaseUrl } from '@/config/apiClientConfig';

const realFetchBaseQuery = fetchBaseQuery({
  baseUrl: apiBaseUrl,
  credentials: 'include',
  paramsSerializer: serializeRepeatedQueryParams,
  prepareHeaders: (headers) => {
    const session = getAuthSession();
    // /auth/session returns the auth cookie on Authorization; replay it as auth-cookie.
    const authCookie = session?.authorization ?? session?.token;
    if (authCookie) {
      headers.set('auth-cookie', authCookie);
    }
    return headers;
  },
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
