import { getCurrentRole } from '@/constants/role';

/** Admin (program manager) — can assign, publish, and create modules. */
export function canPerformDashboardAdminActions(): boolean {
  return getCurrentRole() === 'programManager';
}

/** AM (supervisor) and Admin can view query timestamps in drill-down metadata. */
export function canViewDemandMetadataTimestamps(): boolean {
  const role = getCurrentRole();
  return role === 'supervisor' || role === 'programManager';
}
