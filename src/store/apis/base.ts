import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { apiBaseUrl, useMockApi } from '@/config/apiClientConfig';
import { isLoginEnabled } from '@/config/authConfig';
import { paths } from '@/constants/routes';
import {
  clearAuthSession,
  getAuthSession,
} from '@/features/auth/services/authSession';
import { mockBaseQuery } from '@/store/apis/mockBaseQuery';
import { shouldUseRealFetchForRequest } from '@/store/apis/requestRouting';

export { apiBaseUrl } from '@/config/apiClientConfig';

const realFetchBaseQuery = fetchBaseQuery({
  baseUrl: apiBaseUrl,
  credentials: 'include',
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

const hybridBaseQuery: BaseQueryFn = async (args, api, extraOptions) => {
  let result;
  if (import.meta.env.MODE === 'test') {
    result = await mockBaseQuery(args, api, extraOptions);
  } else if (!useMockApi || shouldUseRealFetchForRequest(args)) {
    result = await realFetchBaseQuery(args, api, extraOptions);
  } else {
    result = await mockBaseQuery(args, api, extraOptions);
  }

  // Intercept HTTP 401 (Unauthorized): clear auth state and redirect to login page
  if (result.error && result.error.status === 401) {
    clearAuthSession();
    if (isLoginEnabled() && typeof window !== 'undefined') {
      const loginUrl = paths.login;
      if (!window.location.pathname.endsWith('/login')) {
        window.location.assign(loginUrl);
      }
    }
  }

  return result;
};

/** Used by unit tests to verify mock vs real fetch routing outside vitest `MODE=test`. */
export const apiRequestBaseQuery = hybridBaseQuery;

export const baseApi = createApi({
  reducerPath: 'baseApi',
  refetchOnMountOrArgChange: true,
  refetchOnFocus: true,
  baseQuery: hybridBaseQuery,
  tagTypes: ['Config', 'ModuleDomains', 'SourceDocuments'],
  endpoints: () => ({}),
});
