import { describe, expect, it } from 'vitest';
import type { AdminUser } from '@/features/modules/api/adminAssignmentApi';
import {
  ALL_DISTRICTS_OPTION,
  ALL_UPAZILAS_OPTION,
  baselineUpazilaNames,
  buildNamedEntityComboboxOptions,
  filterUserIdsForMode,
  getUserLevelEmptyMessage,
  getUserLevelHint,
  hierarchyRoleForMode,
  isPoSelectionMode,
  resolveNamedEntitySelection,
} from './assignmentDialogHelpers';

const po: AdminUser = {
  id: 20,
  name: 'Sobita Rani',
  role: 'PO',
  district: 'Lalmonirhat',
  district_id: 10,
  upazila: 'Hatibandha',
  upazilas: ['Hatibandha'],
  parent_id: null,
};

const skUnderPo: AdminUser = {
  id: 21,
  name: 'Md Abdus Salam',
  role: 'SK',
  district: 'Lalmonirhat',
  district_id: 10,
  upazila: 'Hatibandha',
  upazilas: ['Hatibandha'],
  parent_id: 20,
};

const independentSk: AdminUser = {
  id: 30,
  name: 'Independent SK',
  role: 'SK',
  district: 'Kurigram',
  district_id: 11,
  upazila: 'Ulipur',
  upazilas: ['Ulipur'],
  parent_id: null,
};

const usersById = new Map<number, AdminUser>([
  [po.id, po],
  [skUnderPo.id, skUnderPo],
  [independentSk.id, independentSk],
]);

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

  it('filters user ids for po modes and sk mode', () => {
    expect(
      filterUserIdsForMode([20, 21, 30], usersById, new Set(), 'po'),
    ).toEqual([20]);
    expect(
      filterUserIdsForMode([20, 21, 30], usersById, new Set([20]), 'sk'),
    ).toEqual([30]);
  });

  it('returns mode-specific copy', () => {
    expect(getUserLevelEmptyMessage('sk')).toBe('No SK users found.');
    expect(getUserLevelEmptyMessage('po')).toBe('No program organizers found.');
    expect(getUserLevelHint('po', 'module')).toContain('POs only');
    expect(getUserLevelHint('po_sk', 'module')).toContain('automatically');
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
