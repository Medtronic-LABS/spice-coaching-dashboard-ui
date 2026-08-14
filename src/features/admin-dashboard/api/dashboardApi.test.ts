import { describe, expect, it } from 'vitest';
import { buildDashboardGeoParams } from '@/features/admin-dashboard/utils/dashboardQueryArgs';

describe('dashboardApi', () => {
  it('loads with geography helpers bound for endpoint query builders', async () => {
    const { dashboardApi } =
      await import('@/features/admin-dashboard/api/dashboardApi');

    expect(dashboardApi).toBeDefined();
    expect(
      buildDashboardGeoParams({ division: 'Dhaka', district: '', upazila: '' }),
    ).toEqual({ division: 'Dhaka' });
    expect(dashboardApi.endpoints.fetchDigitalHelpModules).toBeDefined();
    expect(dashboardApi.endpoints.fetchModuleCreationSuggestions).toBeDefined();
  });
});
