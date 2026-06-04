export type AppRole = 'supervisor' | 'programManager';

const ROLE_STORAGE_KEY = 'appRole';

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
  try {
    const storedRole = parseRole(
      window.sessionStorage.getItem(ROLE_STORAGE_KEY),
    );
    if (storedRole) return storedRole;
    else window.sessionStorage.setItem(ROLE_STORAGE_KEY, 'programManager');
    return 'programManager';
  } catch {
    window.sessionStorage.setItem(ROLE_STORAGE_KEY, 'programManager');
    return 'programManager';
  }
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
