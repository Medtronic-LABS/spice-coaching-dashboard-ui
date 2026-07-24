import type { AuthUser } from '@/features/auth/types/auth.types';
import { COACHING_SUITE_ACCESS } from '@/features/auth/constants/spiceSuiteAccess';
import type { SpiceUserProfileEntity } from '@/features/auth/types/spiceUserProfile.types';

function resolveProfileRole(entity: SpiceUserProfileEntity): string {
  const coachingRole = entity.roles.find(
    (role) =>
      role.suiteAccessName.trim().toLowerCase() === COACHING_SUITE_ACCESS,
  );
  if (coachingRole?.name.trim()) return coachingRole.name;

  const defaultRole = entity.defaultRoleName?.trim();
  if (defaultRole) return defaultRole;

  return entity.roles[0]?.name.trim() ?? '';
}

export function mapSpiceProfileToAuthUser(
  entity: SpiceUserProfileEntity,
): AuthUser {
  return {
    tenantId: String(entity.tenantId),
    userId: String(entity.id),
    email: entity.username.trim(),
    firstName: entity.firstName.trim(),
    lastName: entity.lastName.trim(),
    role: resolveProfileRole(entity),
  };
}
