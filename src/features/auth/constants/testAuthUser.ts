import type { AuthUser } from '@/features/auth/types/auth.types';

/** Fixed auth session for unit tests (vitest `MODE=test` skips live profile bootstrap). */
export const TEST_AUTH_USER: AuthUser = {
  tenantId: '2',
  userId: '1',
  email: 'superuser@test.com',
  firstName: 'Rashida',
  lastName: 'Khatun',
  role: 'SUPER_USER',
};
