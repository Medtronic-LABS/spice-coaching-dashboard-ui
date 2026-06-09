export type AppRole = 'supervisor' | 'programManager';

const ROLE_STORAGE_KEY = 'appRole';
const ROLE_SWITCH_ALLOWED =
  import.meta.env.DEV || import.meta.env.MODE === 'test';

function parseRole(value: string | null | undefined): AppRole | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();

  if (normalized === 'supervisor') return 'supervisor';
  if (
    normalized === 'programmanager' ||
    normalized === 'program_manager' ||
    normalized === 'program-manager' ||
    normalized === 'program manager'
  ) {
    return 'programManager';
  }

  return null;
}

export function getCurrentRole(): AppRole {
  const envRole = parseRole(import.meta.env.VITE_APP_ROLE);
  const defaultRole: AppRole = envRole ?? 'supervisor';

  if (!ROLE_SWITCH_ALLOWED) return defaultRole;

  try {
    const storedRole = parseRole(
      window.sessionStorage.getItem(ROLE_STORAGE_KEY),
    );
    return storedRole ?? defaultRole;
  } catch {
    return defaultRole;
  }
}

export function setCurrentRole(role: AppRole): void {
  if (!ROLE_SWITCH_ALLOWED) return;

  try {
    window.sessionStorage.setItem(ROLE_STORAGE_KEY, role);
  } catch {
    // ignore storage access failures
  }
}

export function getAlternateRole(role: AppRole): AppRole {
  return role === 'programManager' ? 'supervisor' : 'programManager';
}

export function canSwitchRole(): boolean {
  return ROLE_SWITCH_ALLOWED;
}
