import { getAuthSession } from '@/features/auth/services/authSession';

function resolveSpiceTenantId(): string {
  return getAuthSession()?.tenantId ?? '0';
}

/** Headers attached to SPICE microservice requests (matches spice-2.0-admin-web interceptors). */
export function getSpiceRequestHeaders(
  extra: Record<string, string> = {},
): Record<string, string> {
  const session = getAuthSession();
  const headers: Record<string, string> = {
    client: 'web',
    tenantId: resolveSpiceTenantId(),
  };

  // Same value as baseApi: session auth cookie from /auth/session Authorization header.
  const authCookie = session?.authorization ?? session?.token;
  if (authCookie) {
    headers['auth-cookie'] = authCookie;
  }

  return {
    ...headers,
    ...extra,
  };
}

export function getSpiceTenantId(): string {
  return resolveSpiceTenantId();
}
