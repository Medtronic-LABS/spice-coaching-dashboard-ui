import { getCoachingSuiteAccess } from '@/features/auth/constants/spiceSuiteAccess';
import type {
  AuthUser,
  LoginResponse,
  LoginRole,
} from '@/features/auth/types/auth.types';

function asIdentityValue(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

function asOptionalText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isLoginRole(value: unknown): value is LoginRole {
  return Boolean(value) && typeof value === 'object';
}

function readRoles(response: LoginResponse): LoginRole[] {
  if (!Array.isArray(response.roles)) return [];
  return response.roles.filter(isLoginRole);
}

function resolveLoginRole(response: LoginResponse): string | null {
  const explicit = asIdentityValue(response.role ?? response.user?.role);
  if (explicit) return explicit;

  const roles = readRoles(response);
  const coachingSuite = getCoachingSuiteAccess();
  const coachingRole = roles.find(
    (role) =>
      typeof role.suiteAccessName === 'string' &&
      role.suiteAccessName.trim().toLowerCase() === coachingSuite,
  );
  const coachingName = asIdentityValue(
    coachingRole?.name ?? coachingRole?.authority,
  );
  if (coachingName) return coachingName;

  for (const role of roles) {
    const name = asIdentityValue(role.name ?? role.authority);
    if (name) return name;
  }

  if (response.isSuperUser === true) return 'SUPER_USER';
  return null;
}

/**
 * Maps `/auth/session` body (+ header auth cookie) into the dashboard session.
 * Spice returns identity fields on the body; Authorization often only in headers.
 */
export function mapLoginResponseToAuthUser(
  response: LoginResponse,
  options: { authCookie: string; usernameFallback: string },
): AuthUser | null {
  const tenantId = asIdentityValue(
    response.tenantId ?? response.user?.tenantId,
  );
  const userId = asIdentityValue(
    response.userId ?? response.id ?? response.user?.userId,
  );
  const role = resolveLoginRole(response);

  if (!tenantId || !userId || !role) return null;

  const email =
    asOptionalText(response.email) ??
    asOptionalText(response.user?.email) ??
    asOptionalText(response.username) ??
    options.usernameFallback;

  return {
    tenantId,
    userId,
    email,
    firstName:
      asOptionalText(response.firstName) ??
      asOptionalText(response.user?.firstName) ??
      'User',
    lastName:
      asOptionalText(response.lastName) ??
      asOptionalText(response.user?.lastName) ??
      '',
    role,
    authorization: options.authCookie,
    token: options.authCookie,
  };
}
