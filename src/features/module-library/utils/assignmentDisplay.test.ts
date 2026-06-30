import { describe, expect, it } from 'vitest';
import type { ModuleAssignment } from '../api/adminAssignmentApi';
import { formatAssignmentTarget } from './assignmentDisplay';

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
