import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { apiBaseUrl } from '@/config/apiClientConfig';
import { isLoginEnabled } from '@/config/authConfig';
import { paths } from '@/constants/routes';
import {
  clearAuthSession,
  getAuthSession,
} from '@/features/auth/services/authSession';
import { redirectToSpiceWeb } from '@/features/auth/utils/redirectToSpiceWeb';
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
  const result = await realFetchBaseQuery(args, api, extraOptions);

  // Intercept HTTP 401 (Unauthorized): clear auth and send the user to re-auth.
  if (result.error && result.error.status === 401) {
    clearAuthSession();
    if (typeof window !== 'undefined') {
      if (isLoginEnabled()) {
        if (window.location.pathname !== paths.login) {
          window.location.assign(paths.login);
        }
      } else {
        redirectToSpiceWeb();
      }
    }
  }

  return result;
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
