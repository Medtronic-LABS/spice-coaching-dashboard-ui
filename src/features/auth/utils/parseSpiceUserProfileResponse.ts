import type {
  SpiceUserProfileEntity,
  SpiceUserProfileResponse,
  SpiceUserProfileRole,
} from '@/features/auth/types/spiceUserProfile.types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseRole(value: unknown): SpiceUserProfileRole | null {
  if (!isRecord(value)) return null;

  const id = value.id;
  const name = value.name;
  const groupName = value.groupName;
  const displayName = value.displayName;
  const suiteAccessName = value.suiteAccessName;

  if (
    typeof id !== 'number' ||
    typeof name !== 'string' ||
    typeof groupName !== 'string' ||
    typeof displayName !== 'string' ||
    typeof suiteAccessName !== 'string'
  ) {
    return null;
  }

  return {
    id,
    name,
    level: typeof value.level === 'number' ? value.level : null,
    groupName,
    displayName,
    suiteAccessName,
    appTypes: Array.isArray(value.appTypes)
      ? value.appTypes.filter(
          (entry): entry is string => typeof entry === 'string',
        )
      : [],
    reportPrivileges: Array.isArray(value.reportPrivileges)
      ? value.reportPrivileges
      : [],
  };
}

function parseEntity(value: unknown): SpiceUserProfileEntity | null {
  if (!isRecord(value)) return null;

  const id = value.id;
  const firstName = value.firstName;
  const lastName = value.lastName;
  const username = value.username;
  const tenantId = value.tenantId;

  if (
    typeof id !== 'number' ||
    typeof firstName !== 'string' ||
    typeof lastName !== 'string' ||
    typeof username !== 'string' ||
    typeof tenantId !== 'number'
  ) {
    return null;
  }

  const roles = Array.isArray(value.roles)
    ? value.roles.flatMap((role) => {
        const parsed = parseRole(role);
        return parsed ? [parsed] : [];
      })
    : [];

  const suiteAccess = Array.isArray(value.suiteAccess)
    ? value.suiteAccess.filter(
        (entry): entry is string => typeof entry === 'string',
      )
    : [];

  return {
    id,
    firstName,
    lastName,
    username,
    tenantId,
    defaultRoleName:
      typeof value.defaultRoleName === 'string' ? value.defaultRoleName : null,
    suiteAccess,
    roles,
  };
}

export function parseSpiceUserProfileResponse(
  value: unknown,
): SpiceUserProfileResponse {
  if (!isRecord(value)) {
    throw new Error('Invalid user profile response.');
  }

  const status = value.status;
  const responseCode = value.responseCode;
  const message = value.message;
  const entity = parseEntity(value.entity);

  if (
    status !== true ||
    typeof responseCode !== 'number' ||
    responseCode !== 200 ||
    typeof message !== 'string' ||
    !entity
  ) {
    throw new Error('Invalid user profile response.');
  }

  return {
    message,
    entity,
    status: true,
    responseCode,
  };
}
