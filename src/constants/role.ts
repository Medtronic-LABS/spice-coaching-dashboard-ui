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
  const envRole = parseRole(import.meta.env.VITE_APP_ROLE);
  if (envRole) return envRole;

  try {
    const storedRole = parseRole(window.localStorage.getItem(ROLE_STORAGE_KEY));
    if (storedRole) return storedRole;
  } catch {
    // ignore storage access failures
  }

  return 'supervisor';
}
