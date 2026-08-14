import { describe, expect, it, vi } from 'vitest';
import { TeamHierarchySection } from '@/features/admin-dashboard/components/TeamHierarchySection';
import { EMPTY_DASHBOARD_GEOGRAPHY } from '@/features/admin-dashboard/hooks/useDashboardFilters';
import { renderWithProviders } from '@/test-utils/render';

const useFetchTeamActivityQuery = vi.hoisted(() => vi.fn());

vi.mock('@/features/admin-dashboard/api/dashboardApi', () => ({
  useFetchTeamActivityQuery: (
    ...args: Parameters<typeof useFetchTeamActivityQuery>
  ) => useFetchTeamActivityQuery(...args),
}));

describe('TeamHierarchySection', () => {
  it('refetches team activity with date and geography params', () => {
    useFetchTeamActivityQuery.mockReturnValue({
      data: { members: [] },
      isLoading: false,
      isFetching: false,
      error: undefined,
      refetch: vi.fn(),
    });

    renderWithProviders(
      <TeamHierarchySection
        fromDate="2026-01-01"
        toDate="2026-01-31"
        geography={{
          ...EMPTY_DASHBOARD_GEOGRAPHY,
          division: 'Dhaka',
          district: 'Gazipur',
        }}
        status="all"
        sortKey="default"
        onSortChange={vi.fn()}
      />,
    );

    expect(useFetchTeamActivityQuery).toHaveBeenCalledWith(
      expect.not.objectContaining({ depth: undefined }),
    );
    expect(useFetchTeamActivityQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        from_date: '2026-01-01',
        to_date: '2026-01-31',
        division: 'Dhaka',
        district: 'Gazipur',
        limit: 100,
        offset: 0,
      }),
    );
  });
});
