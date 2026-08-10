import { describe, expect, it } from 'vitest';
import type { AdminUser } from '../api/adminAssignmentApi';
import {
  buildAssignedUserDisplayNames,
  buildAssignedUserEntries,
  buildEntriesFromAssignedUsers,
  countAssignedUsers,
  formatAssignedUserLabel,
} from './assignmentDisplay';

const sampleUsers: AdminUser[] = [
  {
    id: 20,
    name: 'Sobita Rani',
    role: 'PO',
    district: 'Lalmonirhat',
    district_id: 10,
    upazila: 'Hatibandha',
    upazilas: ['Hatibandha'],
    parent_id: null,
  },
  {
    id: 21,
    name: 'Md Abdus Salam',
    role: 'SK',
    district: 'Lalmonirhat',
    district_id: 10,
    upazila: 'Hatibandha',
    upazilas: ['Hatibandha'],
    parent_id: 20,
  },
  {
    id: 22,
    name: 'Mst. Rabeya Khatun',
    role: 'SK',
    district: 'Lalmonirhat',
    district_id: 10,
    upazila: 'Hatibandha',
    upazilas: ['Hatibandha'],
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

  it('lists POs as individuals for po mode', () => {
    expect(buildAssignedUserEntries('po', [20], sampleUsers)).toEqual([
      {
        kind: 'individual',
        userId: 20,
        role: 'PO',
        name: 'Sobita Rani',
      },
    ]);
    expect(
      countAssignedUsers(buildAssignedUserEntries('po', [20], sampleUsers)),
    ).toBe(1);
  });

  it('counts PO plus SKs', () => {
    const entries = buildAssignedUserEntries('po_sk', [20], sampleUsers);
    expect(countAssignedUsers(entries)).toBe(3);
  });
});

describe('buildAssignedUserDisplayNames', () => {
  it('lists PO and SKs for po_sk mode', () => {
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

describe('buildEntriesFromAssignedUsers', () => {
  it('groups assigned PO with hierarchy SKs', () => {
    const assigned = [sampleUsers[0]!, sampleUsers[1]!, sampleUsers[2]!];
    expect(buildEntriesFromAssignedUsers(assigned, sampleUsers)).toEqual([
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

  it('keeps orphan SKs as individuals', () => {
    const assigned = [sampleUsers[1]!];
    expect(buildEntriesFromAssignedUsers(assigned, sampleUsers)).toEqual([
      {
        kind: 'individual',
        userId: 21,
        role: 'SK',
        name: 'Md Abdus Salam',
      },
    ]);
  });
});

describe('formatAssignedUserLabel', () => {
  it('formats role labels', () => {
    expect(formatAssignedUserLabel(sampleUsers[0]!)).toBe('PO - Sobita Rani');
    expect(formatAssignedUserLabel(sampleUsers[1]!)).toBe(
      'SK - Md Abdus Salam',
    );
  });
});
