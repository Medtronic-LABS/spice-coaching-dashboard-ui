import { setCurrentRole } from '@/constants/role';
import type { AuthUser } from '@/features/auth/types/auth.types';
import { mapSsoRoleToAppRole } from '@/features/auth/utils/mapSsoRoleToAppRole';

const AUTH_SESSION_STORAGE_KEY = 'authSession';

function isAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.tenantId === 'string' &&
    typeof record.userId === 'string' &&
    typeof record.email === 'string' &&
    typeof record.firstName === 'string' &&
    typeof record.lastName === 'string' &&
    typeof record.role === 'string'
  );
}

export function getAuthSession(): AuthUser | null {
  try {
    const raw = window.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isAuthUser(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function setAuthSession(user: AuthUser): void {
  try {
    window.sessionStorage.setItem(
      AUTH_SESSION_STORAGE_KEY,
      JSON.stringify(user),
    );
    setCurrentRole(mapSsoRoleToAppRole(user.role));
  } catch {
    // ignore storage access failures
  }
}

export function clearAuthSession(): void {
  try {
    window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    window.sessionStorage.removeItem('appRole');
  } catch {
    // ignore storage access failures
  }
}

export function logout(): void {
  clearAuthSession();
  window.location.assign(window.location.pathname);
}

export function getAuthDisplayName(user: AuthUser): string {
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  return fullName || user.email;
}

export function getAuthInitials(user: AuthUser): string {
  const first = user.firstName.trim().charAt(0);
  const last = user.lastName.trim().charAt(0);
  const initials = `${first}${last}`.toUpperCase();
  if (initials) return initials;
  return user.email.trim().charAt(0).toUpperCase() || '?';
}
