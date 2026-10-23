import { describe, expect, it } from 'vitest';

describe('dashboardApi', () => {
  it('loads dashboard query endpoints', async () => {
    const { dashboardApi } =
      await import('@/features/admin-dashboard/api/dashboardApi');

    expect(dashboardApi.endpoints.fetchDigitalHelpModules).toBeDefined();
    expect(dashboardApi.endpoints.fetchTeamMemberQuestions).toBeDefined();
    expect(dashboardApi.endpoints.fetchModuleCreationSuggestions).toBeDefined();
  });
});
