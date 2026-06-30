import { getAuthSession } from '@/features/auth/services/authSession';

function resolveSpiceTenantId(): string {
  return getAuthSession()?.tenantId ?? '0';
}

/** Headers attached to SPICE microservice requests (matches spice-2.0-admin-web interceptors). */
export function getSpiceRequestHeaders(
  extra: Record<string, string> = {},
): Record<string, string> {
  return {
    client: 'web',
    tenantId: resolveSpiceTenantId(),
    ...extra,
  };
}

export function getSpiceTenantId(): string {
  return resolveSpiceTenantId();
}
