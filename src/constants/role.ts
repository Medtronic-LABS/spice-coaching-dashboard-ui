import { getAuthSession } from '@/features/auth/services/authSession';

export type AppRole = 'supervisor' | 'programManager';

const ROLE_STORAGE_KEY = 'appRole';

function parseRole(value: string | null | undefined): AppRole | null {
  if (!value) return null;
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  if (normalized === 'supervisor') return 'supervisor';
  if (
    normalized === 'programmanager' ||
    normalized === 'program_manager' ||
    normalized.includes('program_manager')
  ) {
    return 'programManager';
  }

  return null;
}

/**
 * Maps Spice / auth session role strings onto dashboard capability roles.
 * Program-manager capabilities are the default for ops/admin Spice roles.
 */
export function mapAuthRoleToAppRole(
  role: string | null | undefined,
): AppRole | null {
  const direct = parseRole(role);
  if (direct) return direct;
  if (!role) return null;

  const normalized = role
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  if (normalized.includes('supervisor')) return 'supervisor';
  if (
    normalized.includes('super_user') ||
    normalized.includes('superuser') ||
    normalized.includes('super_admin') ||
    normalized.includes('superadmin') ||
    normalized.includes('coaching') ||
    normalized.includes('program') ||
    normalized.includes('admin')
  ) {
    return 'programManager';
  }

  return null;
}

/**
 * Prefer an explicit `setCurrentRole` override (tests/dev), then the
 * authenticated Spice/login session role, then program-manager default.
 */
export function getCurrentRole(): AppRole {
  try {
    const storedRole = parseRole(
      window.sessionStorage.getItem(ROLE_STORAGE_KEY),
    );
    if (storedRole) return storedRole;
  } catch {
    // ignore storage access failures
  }

  const fromAuth = mapAuthRoleToAppRole(getAuthSession()?.role);
  if (fromAuth) return fromAuth;

  return 'programManager';
}

export function setCurrentRole(role: AppRole): void {
  try {
    window.sessionStorage.setItem(ROLE_STORAGE_KEY, role);
  } catch {
    // ignore storage access failures
  }
}

export function getAlternateRole(role: AppRole): AppRole {
  return role === 'programManager' ? 'supervisor' : 'programManager';
}
