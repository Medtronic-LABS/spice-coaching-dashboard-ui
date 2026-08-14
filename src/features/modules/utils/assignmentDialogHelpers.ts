import type { ComboboxOption } from '@/components/ui';
import type {
  AdminUser,
  HierarchyUsersPageParams,
} from '@/features/modules/api/adminAssignmentApi';

export type AssignmentUserLevelMode = 'po_sk' | 'po' | 'sk';

export const ASSIGNMENT_SEARCH_DEBOUNCE_MS = 300;

export const ALL_DIVISIONS_OPTION: ComboboxOption = {
  label: 'All divisions',
  value: '',
};

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

/** Direct SK children of a PO known in the current user map. */
export function childSkIdsForPo(
  poId: number,
  usersById: Map<number, AdminUser>,
): number[] {
  return Array.from(usersById.values())
    .filter((user) => user.role === 'SK' && user.parent_id === poId)
    .map((user) => user.id);
}

/**
 * Full replace set for role-based assign: keep previously selected ids unless
 * removed, plus any newly selected ids. Mode does not strip roles from the payload.
 */
export function buildReplaceAssignmentUserIds(
  desiredUserIds: number[],
): number[] {
  return Array.from(new Set(desiredUserIds));
}

/**
 * When selecting a PO in PO and SK mode, include that PO and all known child SKs.
 * Individual SKs can later be removed from desired without clearing the PO.
 */
export function idsToAddWhenSelectingPo(
  poId: number,
  usersById: Map<number, AdminUser>,
  mode: AssignmentUserLevelMode,
): number[] {
  if (mode === 'po_sk') {
    return [poId, ...childSkIdsForPo(poId, usersById)];
  }
  return [poId];
}

/** When clearing a PO in PO and SK mode, drop the PO and remaining selected child SKs. */
export function idsToRemoveWhenClearingPo(
  poId: number,
  usersById: Map<number, AdminUser>,
  mode: AssignmentUserLevelMode,
): number[] {
  if (mode === 'po_sk') {
    return [poId, ...childSkIdsForPo(poId, usersById)];
  }
  return [poId];
}

/**
 * Build the visible assignment list.
 *
 * When filters are active, only show API-filtered `loadedUsers` (do not inject
 * already-assigned users from outside the filter). Off-filter selected ids stay
 * in desired state and are still sent on save.
 *
 * When filters are clear, pin already-assigned users for the mode so they remain
 * visible/checked even if not on the current page.
 */
export function buildAssignmentListUsers(
  mode: AssignmentUserLevelMode,
  loadedUsers: AdminUser[],
  assignedUsers: AdminUser[],
  filtersActive: boolean,
): AdminUser[] {
  const result: AdminUser[] = [];
  const seen = new Set<number>();

  const push = (user: AdminUser | undefined) => {
    if (!user || seen.has(user.id)) return;
    if (mode === 'sk' && user.role !== 'SK') return;
    if (mode !== 'sk' && user.role !== 'PO') return;
    seen.add(user.id);
    result.push(user);
  };

  if (!filtersActive) {
    for (const user of assignedUsers) push(user);
  }
  for (const user of loadedUsers) push(user);
  return result;
}

export function hasAssignmentUserFilters(input: {
  divisionId: number | null;
  districtId: number | null;
  upazilaId: number | null;
  searchQuery: string;
}): boolean {
  return (
    input.divisionId !== null ||
    input.districtId !== null ||
    input.upazilaId !== null ||
    input.searchQuery.trim().length > 0
  );
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

/**
 * Add `names` to the selection unless every name is already selected,
 * in which case remove them.
 */
export function toggleNamesInSelection(
  current: string[],
  names: string[],
): string[] {
  if (names.length === 0) return current;
  const selected = new Set(current);
  const allSelected = names.every((name) => selected.has(name));
  if (allSelected) {
    const remove = new Set(names);
    return current.filter((name) => !remove.has(name));
  }
  const next = [...current];
  for (const name of names) {
    if (!selected.has(name)) {
      next.push(name);
      selected.add(name);
    }
  }
  return next;
}
