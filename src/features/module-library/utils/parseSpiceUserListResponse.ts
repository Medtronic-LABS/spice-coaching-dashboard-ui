import { extractSpiceEntityList } from '@/features/module-library/utils/parseSpiceSuccessResponse';

export interface ParsedSpiceUser {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  tenantId?: number;
  villages?: Array<{ id: number; name: string }>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseVillages(value: unknown): ParsedSpiceUser['villages'] {
  if (!Array.isArray(value)) return undefined;
  const villages = value
    .map((item) => {
      if (!isRecord(item)) return null;
      const id = item.id;
      const name = item.name;
      if (typeof id !== 'number' || typeof name !== 'string') return null;
      return { id, name };
    })
    .filter((v): v is { id: number; name: string } => v !== null);
  return villages.length > 0 ? villages : undefined;
}

function normalizeUser(item: unknown): ParsedSpiceUser | null {
  if (!isRecord(item)) return null;
  const id = item.id;
  const firstName = item.firstName;
  const lastName = item.lastName;
  const username = item.username;
  if (
    typeof id !== 'number' ||
    typeof firstName !== 'string' ||
    typeof lastName !== 'string'
  ) {
    return null;
  }
  return {
    id,
    firstName,
    lastName,
    username: typeof username === 'string' ? username : '',
    tenantId: typeof item.tenantId === 'number' ? item.tenantId : undefined,
    villages: parseVillages(item.villages),
  };
}

/** Normalize user-service `/user/admin-users` SuccessMessage into CHW rows. */
export function parseSpiceUserListResponse(
  response: unknown,
): ParsedSpiceUser[] {
  return extractSpiceEntityList(response)
    .map(normalizeUser)
    .filter((user): user is ParsedSpiceUser => user !== null);
}
