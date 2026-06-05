import { getCurrentRole } from '@/constants/role';

/** Supervisors can browse module review steps but cannot edit or publish. */
export function useAdminModuleReviewReadonly(): boolean {
  return getCurrentRole() !== 'programManager';
}
