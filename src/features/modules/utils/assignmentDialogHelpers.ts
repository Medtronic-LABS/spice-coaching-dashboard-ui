import type { ComboboxOption } from '@/components/ui';
import type {
  AdminUser,
  HierarchyUsersPageParams,
} from '@/features/modules/api/adminAssignmentApi';

export type AssignmentUserLevelMode = 'po_sk' | 'po' | 'sk';

export const ASSIGNMENT_SEARCH_DEBOUNCE_MS = 300;

export const ALL_DISTRICTS_OPTION: ComboboxOption = {
  label: 'All districts',
  value: '',
};

export const ALL_UPAZILAS_OPTION: ComboboxOption = {
  label: 'All upazilas',
  value: '',
};

interface NamedEntity {
  id: number;
  name: string;
}

/** Keep a selected entity visible when it is not in the current loaded page. */
export function buildNamedEntityComboboxOptions(
  allOption: ComboboxOption,
  loaded: NamedEntity[],
  selectedId: number | null,
  selectedName: string,
): ComboboxOption[] {
  const options: ComboboxOption[] = [
    allOption,
    ...loaded.map((entity) => ({
      label: entity.name,
      value: String(entity.id),
    })),
  ];
  if (
    selectedId !== null &&
    selectedName &&
    !loaded.some((entity) => entity.id === selectedId)
  ) {
    options.splice(1, 0, {
      label: selectedName,
      value: String(selectedId),
    });
  }
  return options;
}

export function resolveNamedEntitySelection(
  value: string,
  loaded: NamedEntity[],
  selectedId: number | null,
  selectedName: string,
): { id: number | null; name: string } {
  if (value === '') {
    return { id: null, name: '' };
  }
  const id = Number(value);
  if (!Number.isFinite(id)) {
    return { id: null, name: '' };
  }
  const match =
    loaded.find((entity) => entity.id === id) ??
    (selectedId === id ? { id, name: selectedName } : undefined);
  return { id, name: match?.name ?? '' };
}

export function getUserLevelEmptyMessage(
  mode: AssignmentUserLevelMode,
): string {
  if (mode === 'sk') return 'No SK users found.';
  return 'No program organizers found.';
}

export function hierarchyRoleForMode(
  mode: AssignmentUserLevelMode,
): HierarchyUsersPageParams['role'] {
  return mode === 'sk' ? 'SHASTIYA_KORMI' : 'PO';
}

export function isPoSelectionMode(mode: AssignmentUserLevelMode): boolean {
  return mode === 'po_sk' || mode === 'po';
}

/** Role-based payload / UI selection ids for the active assignment mode. */
export function filterUserIdsForMode(
  userIds: number[],
  usersById: Map<number, AdminUser>,
  parentSelectedIds: Set<number>,
  mode: AssignmentUserLevelMode,
): number[] {
  if (isPoSelectionMode(mode)) {
    return userIds.filter((id) => usersById.get(id)?.role === 'PO');
  }
  return userIds.filter((id) => {
    const user = usersById.get(id);
    if (!user || user.role !== 'SK') return false;
    if (user.parent_id !== null && parentSelectedIds.has(user.parent_id)) {
      return false;
    }
    return true;
  });
}

export function baselineUpazilaNames(users: AdminUser[]): string[] {
  return Array.from(
    new Set(
      users.flatMap((user) => {
        if (user.upazilas?.length) return user.upazilas;
        return user.upazila ? [user.upazila] : [];
      }),
    ),
  ).sort((a, b) => a.localeCompare(b));
}
