import type {
  AdminUser,
  AdminUserRole,
} from '@/features/modules/api/adminAssignmentApi';

export type HierarchyApiRole =
  | 'AREA_MANAGER'
  | 'PO'
  | 'SHASTIYA_KORMI'
  | 'AM'
  | 'SK';

export interface HierarchyUpazilaRef {
  id: number;
  name: string;
}

export interface HierarchyUserWire {
  id: number;
  name: string;
  role: string;
  parent_id: number | null;
  district_id: number;
  district?: string;
  upazilas?: HierarchyUpazilaRef[] | unknown;
  upazila?: string | null;
}

export interface HierarchyUserListWire {
  users: unknown[];
  total: number;
  total_pages: number;
  limit: number;
  offset: number;
}

export interface DistrictWire {
  id: number;
  name: string;
}

export interface DistrictListWire {
  districts: unknown[];
  total: number;
  total_pages: number;
  limit: number;
  offset: number;
}

const HIERARCHY_PAGE_SIZE = 200;

export function getHierarchyPageSize(): number {
  return HIERARCHY_PAGE_SIZE;
}

export function mapHierarchyRole(role: unknown): AdminUserRole | null {
  if (role === 'AREA_MANAGER' || role === 'AM') return 'AM';
  if (role === 'PO') return 'PO';
  if (role === 'SHASTIYA_KORMI' || role === 'SK') return 'SK';
  return null;
}

function parseUpazilaNames(record: Record<string, unknown>): string[] {
  const names: string[] = [];
  const upazilas = record.upazilas;

  if (Array.isArray(upazilas)) {
    for (const item of upazilas) {
      if (typeof item === 'string' && item.trim()) {
        names.push(item.trim());
        continue;
      }
      if (!item || typeof item !== 'object') continue;
      const name = (item as Record<string, unknown>).name;
      if (typeof name === 'string' && name.trim()) {
        names.push(name.trim());
      }
    }
  }

  const singular = record.upazila;
  if (typeof singular === 'string' && singular.trim()) {
    const trimmed = singular.trim();
    if (!names.includes(trimmed)) {
      names.push(trimmed);
    }
  }

  return names;
}

export function mapHierarchyUserToAdminUser(
  raw: unknown,
  districtNameById: ReadonlyMap<number, string>,
): AdminUser | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;

  const id = record.id;
  const name = record.name;
  const role = mapHierarchyRole(record.role);
  const districtId = record.district_id;
  const parentId = record.parent_id;

  if (typeof id !== 'number' || typeof name !== 'string' || role === null) {
    return null;
  }

  const resolvedDistrictId =
    typeof districtId === 'number' && Number.isFinite(districtId)
      ? districtId
      : 0;

  const districtFromWire =
    typeof record.district === 'string' && record.district.trim()
      ? record.district.trim()
      : null;
  const districtFromLookup =
    resolvedDistrictId > 0
      ? (districtNameById.get(resolvedDistrictId) ?? null)
      : null;
  const district =
    districtFromWire ??
    districtFromLookup ??
    (resolvedDistrictId > 0 ? `District #${resolvedDistrictId}` : '');

  const upazilas = parseUpazilaNames(record);

  if (!district) {
    // Assignment payloads sometimes omit district; still map the user so
    // already-assigned rows can be selected in the modal.
    return {
      id,
      name,
      role,
      district: '—',
      district_id: resolvedDistrictId,
      upazila: upazilas[0] ?? null,
      upazilas,
      parent_id: typeof parentId === 'number' ? parentId : null,
    };
  }

  return {
    id,
    name,
    role,
    district,
    district_id: resolvedDistrictId,
    upazila: upazilas[0] ?? null,
    upazilas,
    parent_id: typeof parentId === 'number' ? parentId : null,
  };
}

export function mapHierarchyUsersToAdminUsers(
  users: unknown[],
  districtNameById: ReadonlyMap<number, string>,
): AdminUser[] {
  return users.flatMap((user) => {
    const mapped = mapHierarchyUserToAdminUser(user, districtNameById);
    return mapped ? [mapped] : [];
  });
}

export function parseHierarchyUserListResponse(response: unknown): {
  users: unknown[];
  total: number;
} {
  if (Array.isArray(response)) {
    return { users: response, total: response.length };
  }
  if (!response || typeof response !== 'object') {
    return { users: [], total: 0 };
  }
  const record = response as Record<string, unknown>;
  const users = Array.isArray(record.users) ? record.users : [];
  const total =
    typeof record.total === 'number' && Number.isFinite(record.total)
      ? record.total
      : users.length;
  return { users, total };
}

export function parseDistrictListResponse(response: unknown): {
  districts: DistrictWire[];
  total: number;
} {
  if (!response || typeof response !== 'object') {
    return { districts: [], total: 0 };
  }
  const record = response as Record<string, unknown>;
  const rawDistricts = Array.isArray(record.districts) ? record.districts : [];
  const districts = rawDistricts.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const row = item as Record<string, unknown>;
    if (typeof row.id !== 'number' || typeof row.name !== 'string') return [];
    return [{ id: row.id, name: row.name }];
  });
  const total =
    typeof record.total === 'number' && Number.isFinite(record.total)
      ? record.total
      : districts.length;
  return { districts, total };
}

export function parseDivisionListResponse(response: unknown): {
  divisions: Array<{ id: number; name: string }>;
  total: number;
} {
  if (!response || typeof response !== 'object') {
    return { divisions: [], total: 0 };
  }
  const record = response as Record<string, unknown>;
  const rawDivisions = Array.isArray(record.divisions) ? record.divisions : [];
  const divisions = rawDivisions.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const row = item as Record<string, unknown>;
    if (typeof row.id !== 'number' || typeof row.name !== 'string') return [];
    return [{ id: row.id, name: row.name }];
  });
  const total =
    typeof record.total === 'number' && Number.isFinite(record.total)
      ? record.total
      : divisions.length;
  return { divisions, total };
}

export interface UpazilaWire {
  id: number;
  name: string;
  district_id: number;
}

export function parseUpazilaListResponse(response: unknown): {
  upazilas: UpazilaWire[];
  total: number;
} {
  if (!response || typeof response !== 'object') {
    return { upazilas: [], total: 0 };
  }
  const record = response as Record<string, unknown>;
  const rawUpazilas = Array.isArray(record.upazilas) ? record.upazilas : [];
  const upazilas = rawUpazilas.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const row = item as Record<string, unknown>;
    if (
      typeof row.id !== 'number' ||
      typeof row.name !== 'string' ||
      typeof row.district_id !== 'number'
    ) {
      return [];
    }
    const name = row.name.trim();
    if (!name) return [];
    return [{ id: row.id, name, district_id: row.district_id }];
  });
  const total =
    typeof record.total === 'number' && Number.isFinite(record.total)
      ? record.total
      : upazilas.length;
  return { upazilas, total };
}

export function buildDistrictNameById(
  districts: DistrictWire[],
): Map<number, string> {
  return new Map(districts.map((district) => [district.id, district.name]));
}

/** True when the user belongs to the given upazila (multi-upazila aware). */
export function userMatchesUpazila(
  user: Pick<AdminUser, 'upazila' | 'upazilas'>,
  upazilaName: string,
): boolean {
  if (!upazilaName) return true;
  if (user.upazilas?.includes(upazilaName)) return true;
  return user.upazila === upazilaName;
}
