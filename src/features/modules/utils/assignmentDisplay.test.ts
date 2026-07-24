import { describe, expect, it } from 'vitest';
import type { AdminUser, ModuleAssignment } from '../api/adminAssignmentApi';
import {
  buildAssignedUserDisplayNames,
  buildAssignedUserEntries,
  countAssignedUsers,
  formatAssignmentTarget,
} from './assignmentDisplay';

const baseAssignment: ModuleAssignment = {
  id: '1',
  module_id: 'mod-1',
  module_title: { bn: 'Test', en: 'Test' },
  tenant_id: null,
  user_id: null,
  assigned_by: 1,
  assigned_at: '2026-01-01T00:00:00Z',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const sampleUsers: AdminUser[] = [
  {
    id: 20,
    name: 'Sobita Rani',
    role: 'PO',
    district: 'Lalmonirhat',
    upazila: 'Hatibandha',
    parent_id: null,
  },
  {
    id: 21,
    name: 'Md Abdus Salam',
    role: 'SK',
    district: 'Lalmonirhat',
    upazila: 'Hatibandha',
    parent_id: 20,
  },
  {
    id: 22,
    name: 'Mst. Rabeya Khatun',
    role: 'SK',
    district: 'Lalmonirhat',
    upazila: 'Hatibandha',
    parent_id: 20,
  },
];

describe('buildAssignedUserEntries', () => {
  it('groups SK users under each PO for po_sk mode', () => {
    expect(buildAssignedUserEntries('po_sk', [20], sampleUsers)).toEqual([
      {
        kind: 'po_sk',
        poId: 20,
        poName: 'Sobita Rani',
        skUsers: [
          { userId: 21, name: 'Md Abdus Salam' },
          { userId: 22, name: 'Mst. Rabeya Khatun' },
        ],
      },
    ]);
  });

  it('counts all PO and SK users in po_sk groups', () => {
    const entries = buildAssignedUserEntries('po_sk', [20], sampleUsers);
    expect(countAssignedUsers(entries)).toBe(3);
  });
});

describe('buildAssignedUserDisplayNames', () => {
  it('lists PO and SK users separately for po_sk mode', () => {
    expect(buildAssignedUserDisplayNames('po_sk', [20], sampleUsers)).toEqual([
      'PO - Sobita Rani',
      'SK - Md Abdus Salam',
      'SK - Mst. Rabeya Khatun',
    ]);
  });

  it('lists PO users for po mode', () => {
    expect(buildAssignedUserDisplayNames('po', [20], sampleUsers)).toEqual([
      'PO - Sobita Rani',
    ]);
  });

  it('lists SK users for sk mode', () => {
    expect(buildAssignedUserDisplayNames('sk', [21, 22], sampleUsers)).toEqual([
      'SK - Md Abdus Salam',
      'SK - Mst. Rabeya Khatun',
    ]);
  });
});

describe('formatAssignmentTarget', () => {
  it('formats individual assignments with user metadata', () => {
    const assignment: ModuleAssignment = {
      ...baseAssignment,
      assignment_type: 'individual',
      user_id: 10,
      user: {
        id: 10,
        name: 'Md Abdus Salam',
        role: 'SK',
        district: 'Lalmonirhat',
        upazila: 'Lalmonirhat Sadar',
        parent_id: 1,
      },
    };

    expect(formatAssignmentTarget(assignment)).toBe('SK - Md Abdus Salam');
  });

  it('formats po_sk assignments with user metadata', () => {
    const assignment: ModuleAssignment = {
      ...baseAssignment,
      assignment_type: 'po_sk',
      user_id: 20,
      user: {
        id: 20,
        name: 'Sobita Rani',
        role: 'PO',
        district: 'Lalmonirhat',
        upazila: 'Hatibandha',
        parent_id: null,
      },
    };

    expect(formatAssignmentTarget(assignment)).toBe('PO + SKs - Sobita Rani');
  });

  it('formats geographical assignments with upazila', () => {
    const assignment: ModuleAssignment = {
      ...baseAssignment,
      assignment_type: 'geographical',
      upazila: 'Lalmonirhat Sadar',
    };

    expect(formatAssignmentTarget(assignment)).toBe(
      'Upazila - Lalmonirhat Sadar',
    );
  });

  it('formats group assignments with tenant id', () => {
    const assignment: ModuleAssignment = {
      ...baseAssignment,
      assignment_type: 'group',
      tenant_id: 4000,
    };

    expect(formatAssignmentTarget(assignment)).toBe('Organization #4000');
  });

  it('falls back gracefully when metadata is missing', () => {
    expect(
      formatAssignmentTarget({
        ...baseAssignment,
        assignment_type: 'individual',
        user_id: 99,
      }),
    ).toBe('User #99');

    expect(
      formatAssignmentTarget({
        ...baseAssignment,
        assignment_type: 'geographical',
      }),
    ).toBe('Unknown upazila');
  });
});
