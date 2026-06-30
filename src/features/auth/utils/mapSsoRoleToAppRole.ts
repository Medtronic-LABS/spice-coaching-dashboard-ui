import type { AppRole } from '@/constants/role';

export function mapSsoRoleToAppRole(ssoRole: string): AppRole {
  const normalized = ssoRole
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  if (
    normalized === 'supervisor' ||
    normalized === 'chw_supervisor' ||
    normalized === 'field_supervisor'
  ) {
    return 'supervisor';
  }

  if (
    normalized === 'program_manager' ||
    normalized === 'programmanager' ||
    normalized === 'super_user' ||
    normalized === 'superuser' ||
    normalized === 'admin'
  ) {
    return 'programManager';
  }

  return 'programManager';
}
