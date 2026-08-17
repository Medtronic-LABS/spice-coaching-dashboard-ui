import { describe, expect, it } from 'vitest';
import type { AdminUser } from '@/features/modules/api/adminAssignmentApi';
import {
  ALL_DISTRICTS_OPTION,
  ALL_UPAZILAS_OPTION,
  baselineUpazilaIds,
  baselineUpazilaNames,
  buildAssignmentListUsers,
  buildNamedEntityComboboxOptions,
  buildReplaceAssignmentUserIds,
  childSkIdsForPo,
  getUserLevelEmptyMessage,
  hasAssignmentUserFilters,
  hierarchyRoleForMode,
  idsToAddWhenSelectingPo,
  idsToRemoveWhenClearingPo,
  isPoSelectionMode,
  canRefreshUpazilaCatalog,
  mergeNamedEntityPages,
  resolveNamedEntitySelection,
  shouldShowGeoCatalogRefresh,
  toggleIdsInSelection,
  toggleNamesInSelection,
} from './assignmentDialogHelpers';

const po: AdminUser = {
  id: 20,
  name: 'Sobita Rani',
  role: 'PO',
  division: 'Rangpur',
  division_id: 1,
  district: 'Lalmonirhat',
  district_id: 10,
  upazila: 'Hatibandha',
  upazilas: ['Hatibandha'],
  upazila_ids: [2],
  parent_id: null,
};

const skUnderPo: AdminUser = {
  id: 21,
  name: 'Md Abdus Salam',
  role: 'SK',
  division: 'Rangpur',
  division_id: 1,
  district: 'Lalmonirhat',
  district_id: 10,
  upazila: 'Hatibandha',
  upazilas: ['Hatibandha'],
  upazila_ids: [2],
  parent_id: 20,
};

const independentSk: AdminUser = {
  id: 30,
  name: 'Independent SK',
  role: 'SK',
  division: 'Rangpur',
  division_id: 1,
  district: 'Kurigram',
  district_id: 11,
  upazila: 'Ulipur',
  upazilas: ['Ulipur'],
  upazila_ids: [3],
  parent_id: null,
};

const usersById = new Map<number, AdminUser>([
  [po.id, po],
  [skUnderPo.id, skUnderPo],
  [independentSk.id, independentSk],
]);

describe('shouldShowGeoCatalogRefresh', () => {
  it('shows refresh when the catalog is empty and not loading', () => {
    expect(
      shouldShowGeoCatalogRefresh({
        loadedCount: 0,
        catalogLoading: false,
      }),
    ).toBe(true);
  });

  it('hides refresh while the catalog is loading', () => {
    expect(
      shouldShowGeoCatalogRefresh({
        loadedCount: 0,
        catalogLoading: true,
      }),
    ).toBe(false);
  });

  it('hides refresh when options are loaded', () => {
    expect(
      shouldShowGeoCatalogRefresh({
        loadedCount: 3,
        catalogLoading: false,
      }),
    ).toBe(false);
  });

  it('shows refresh on fetch error even when options exist', () => {
    expect(
      shouldShowGeoCatalogRefresh({
        loadedCount: 2,
        catalogLoading: false,
        isError: true,
      }),
    ).toBe(true);
  });

  it('hides refresh while any geo catalog is loading', () => {
    expect(
      shouldShowGeoCatalogRefresh({
        loadedCount: 0,
        catalogLoading: false,
        isError: true,
        anyGeoLoading: true,
      }),
    ).toBe(false);
  });

  it('hides refresh while a catalog refresh is pending', () => {
    expect(
      shouldShowGeoCatalogRefresh({
        loadedCount: 0,
        catalogLoading: false,
        catalogPending: true,
      }),
    ).toBe(false);
  });
});

describe('canRefreshUpazilaCatalog', () => {
  it('allows refresh when no division is selected', () => {
    expect(
      canRefreshUpazilaCatalog({
        selectedDivisionId: null,
        selectedDistrictId: null,
      }),
    ).toBe(true);
  });

  it('allows refresh when division and district are selected', () => {
    expect(
      canRefreshUpazilaCatalog({
        selectedDivisionId: 1,
        selectedDistrictId: 10,
      }),
    ).toBe(true);
  });

  it('blocks refresh when division is selected without a district', () => {
    expect(
      canRefreshUpazilaCatalog({
        selectedDivisionId: 1,
        selectedDistrictId: null,
      }),
    ).toBe(false);
  });
});

describe('mergeNamedEntityPages', () => {
  it('replaces the list when append is false', () => {
    expect(
      mergeNamedEntityPages(
        [{ id: 1, name: 'Old' }],
        [{ id: 2, name: 'New' }],
        false,
      ),
    ).toEqual([{ id: 2, name: 'New' }]);
  });

  it('appends and dedupes by id', () => {
    expect(
      mergeNamedEntityPages(
        [{ id: 1, name: 'Rangpur' }],
        [
          { id: 1, name: 'Rangpur duplicate' },
          { id: 2, name: 'Rajshahi' },
        ],
        true,
      ),
    ).toEqual([
      { id: 1, name: 'Rangpur' },
      { id: 2, name: 'Rajshahi' },
    ]);
  });
});

describe('buildNamedEntityComboboxOptions', () => {
  it('includes the all-option and loaded entities', () => {
    expect(
      buildNamedEntityComboboxOptions(
        ALL_DISTRICTS_OPTION,
        [{ id: 10, name: 'Lalmonirhat' }],
        null,
        '',
      ),
    ).toEqual([ALL_DISTRICTS_OPTION, { label: 'Lalmonirhat', value: '10' }]);
  });

  it('inserts a selected entity missing from the loaded page', () => {
    expect(
      buildNamedEntityComboboxOptions(
        ALL_UPAZILAS_OPTION,
        [{ id: 1, name: 'Hatibandha' }],
        2,
        'Patgram',
      ),
    ).toEqual([
      ALL_UPAZILAS_OPTION,
      { label: 'Patgram', value: '2' },
      { label: 'Hatibandha', value: '1' },
    ]);
  });
});

describe('resolveNamedEntitySelection', () => {
  it('clears selection for empty value', () => {
    expect(
      resolveNamedEntitySelection(
        '',
        [{ id: 10, name: 'Lalmonirhat' }],
        10,
        'Lalmonirhat',
      ),
    ).toEqual({ id: null, name: '' });
  });

  it('resolves id and name from loaded list', () => {
    expect(
      resolveNamedEntitySelection(
        '10',
        [{ id: 10, name: 'Lalmonirhat' }],
        null,
        '',
      ),
    ).toEqual({ id: 10, name: 'Lalmonirhat' });
  });

  it('keeps selected name when entity is not in loaded list', () => {
    expect(resolveNamedEntitySelection('11', [], 11, 'Kurigram')).toEqual({
      id: 11,
      name: 'Kurigram',
    });
  });
});

describe('assignment mode helpers', () => {
  it('maps modes to hierarchy roles and PO selection', () => {
    expect(hierarchyRoleForMode('po_sk')).toBe('PO');
    expect(hierarchyRoleForMode('po')).toBe('PO');
    expect(hierarchyRoleForMode('sk')).toBe('SHASTIYA_KORMI');
    expect(isPoSelectionMode('po_sk')).toBe(true);
    expect(isPoSelectionMode('po')).toBe(true);
    expect(isPoSelectionMode('sk')).toBe(false);
  });

  it('builds explicit replace ids without mode filtering', () => {
    expect(buildReplaceAssignmentUserIds([20, 21, 20, 30])).toEqual([
      20, 21, 30,
    ]);
  });

  it('expands PO selection to child SKs only in po_sk mode', () => {
    expect(childSkIdsForPo(20, usersById)).toEqual([21]);
    expect(idsToAddWhenSelectingPo(20, usersById, 'po_sk')).toEqual([20, 21]);
    expect(idsToAddWhenSelectingPo(20, usersById, 'po')).toEqual([20]);
    expect(idsToRemoveWhenClearingPo(20, usersById, 'po_sk')).toEqual([20, 21]);
  });

  it('puts already-assigned POs first when filters are clear', () => {
    const loadedOnly = [independentSk, po];
    const assigned = [po, skUnderPo];
    const list = buildAssignmentListUsers('po_sk', loadedOnly, assigned, false);
    expect(list.map((user) => user.id)).toEqual([20]);
    expect(list.every((user) => user.role === 'PO')).toBe(true);
  });

  it('shows only filtered loaded users when filters are active', () => {
    const filteredPo = {
      ...po,
      id: 99,
      name: 'Filtered PO',
    };
    const list = buildAssignmentListUsers(
      'po_sk',
      [filteredPo],
      [po, skUnderPo],
      true,
    );
    expect(list.map((user) => user.id)).toEqual([99]);
  });

  it('lists assigned SKs on the SK only tab when filters are clear', () => {
    const list = buildAssignmentListUsers(
      'sk',
      [independentSk],
      [skUnderPo],
      false,
    );
    expect(list.map((user) => user.id)).toEqual([21, 30]);
  });

  it('detects active assignment user filters', () => {
    expect(
      hasAssignmentUserFilters({
        divisionId: null,
        districtId: null,
        upazilaId: null,
        searchQuery: '',
      }),
    ).toBe(false);
    expect(
      hasAssignmentUserFilters({
        divisionId: 1,
        districtId: null,
        upazilaId: null,
        searchQuery: '',
      }),
    ).toBe(true);
    expect(
      hasAssignmentUserFilters({
        divisionId: null,
        districtId: 10,
        upazilaId: null,
        searchQuery: '',
      }),
    ).toBe(true);
    expect(
      hasAssignmentUserFilters({
        divisionId: null,
        districtId: null,
        upazilaId: null,
        searchQuery: 'ab',
      }),
    ).toBe(true);
  });

  it('returns mode-specific empty messages', () => {
    expect(getUserLevelEmptyMessage('sk')).toBe('No SK users found.');
    expect(getUserLevelEmptyMessage('po')).toBe('No users found.');
    expect(getUserLevelEmptyMessage('po_sk')).toBe('No users found.');
  });
});

describe('baselineUpazilaNames', () => {
  it('dedupes and sorts upazila names', () => {
    expect(baselineUpazilaNames([po, independentSk, skUnderPo])).toEqual([
      'Hatibandha',
      'Ulipur',
    ]);
  });
});

describe('baselineUpazilaIds', () => {
  it('dedupes and sorts upazila ids', () => {
    expect(baselineUpazilaIds([po, independentSk, skUnderPo])).toEqual([2, 3]);
  });
});

describe('toggleNamesInSelection', () => {
  it('adds missing names when any are unselected', () => {
    expect(
      toggleNamesInSelection(['Hatibandha'], ['Hatibandha', 'Ulipur']),
    ).toEqual(['Hatibandha', 'Ulipur']);
  });

  it('removes names when every name is already selected', () => {
    expect(
      toggleNamesInSelection(['Hatibandha', 'Ulipur'], ['Hatibandha']),
    ).toEqual(['Ulipur']);
  });

  it('returns the current selection when names is empty', () => {
    expect(toggleNamesInSelection(['Hatibandha'], [])).toEqual(['Hatibandha']);
  });
});

describe('toggleIdsInSelection', () => {
  it('adds missing ids when any are unselected', () => {
    expect(toggleIdsInSelection([2], [2, 3])).toEqual([2, 3]);
  });

  it('removes ids when every id is already selected', () => {
    expect(toggleIdsInSelection([2, 3], [2])).toEqual([3]);
  });
});
