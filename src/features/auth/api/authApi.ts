import { baseApi } from '@/store/apis/base';
import type {
  LoginCredentials,
  LoginResponse,
} from '@/features/auth/types/auth.types';
import {
  extractAuthCookieFromResponseHeaders,
  normalizeAuthCookieValue,
} from '@/features/auth/utils/authCookie';

/** Builds the `/auth/session` FormData POST used by the login mutation. */
export function buildLoginQuery(credentials: LoginCredentials): {
  url: string;
  method: string;
  body: FormData;
} {
  const formData = new FormData();
  formData.append('username', credentials.username);
  formData.append('password', credentials.password);
  return {
    url: '/auth/session',
    method: 'POST',
    body: formData,
  };
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginCredentials>({
      query: buildLoginQuery,
      transformResponse: (response: unknown, meta) => {
        // Auth cookie is returned on Authorization (and auth-cookie) from coaching-platform.
        const authCookie = extractAuthCookieFromResponseHeaders(
          meta?.response?.headers,
        );

        const baseObj =
          response && typeof response === 'object'
            ? (response as Record<string, unknown>)
            : {};

        const bodyAuthRaw =
          typeof baseObj.authorization === 'string'
            ? baseObj.authorization
            : typeof baseObj.token === 'string'
              ? baseObj.token
              : undefined;
        const bodyAuth = bodyAuthRaw
          ? normalizeAuthCookieValue(bodyAuthRaw)
          : undefined;

        return {
          ...baseObj,
          authorization: authCookie ?? bodyAuth,
        } satisfies LoginResponse;
      },
    }),
  }),
  overrideExisting: false,
});

export const { useLoginMutation } = authApi;
