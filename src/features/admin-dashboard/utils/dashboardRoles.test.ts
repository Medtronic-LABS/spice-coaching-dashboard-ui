import { describe, expect, it, beforeEach } from 'vitest';
import { setCurrentRole } from '@/constants/role';
import {
  canPerformDashboardAdminActions,
  canViewDemandMetadataTimestamps,
} from '@/features/admin-dashboard/utils/dashboardRoles';

describe('dashboardRoles', () => {
  beforeEach(() => {
    setCurrentRole('programManager');
  });

  it('allows admin actions for program managers only', () => {
    setCurrentRole('programManager');
    expect(canPerformDashboardAdminActions()).toBe(true);

    setCurrentRole('supervisor');
    expect(canPerformDashboardAdminActions()).toBe(false);
  });

  it('allows metadata timestamps for AM and Admin dashboard roles', () => {
    setCurrentRole('supervisor');
    expect(canViewDemandMetadataTimestamps()).toBe(true);

    setCurrentRole('programManager');
    expect(canViewDemandMetadataTimestamps()).toBe(true);
  });
});
