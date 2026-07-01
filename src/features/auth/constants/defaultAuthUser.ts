import type { AuthUser } from '@/features/auth/types/auth.types';

/** Temporary default session used when no SSO redirect params are present. */
export const DEFAULT_AUTH_USER: AuthUser = {
  tenantId: '2',
  userId: '1',
  email: 'superuser@test.com',
  firstName: 'Subhodeep',
  lastName: 'User',
  role: 'PROGRAM_MANAGER',
};
