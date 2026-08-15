import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamHierarchySection } from '@/features/admin-dashboard/components/TeamHierarchySection';
import { EMPTY_DASHBOARD_GEOGRAPHY } from '@/features/admin-dashboard/hooks/useDashboardFilters';
import { renderWithProviders } from '@/test-utils/render';

const useFetchTeamActivityQuery = vi.hoisted(() => vi.fn());
const getAuthSession = vi.hoisted(() => vi.fn(() => null));

vi.mock('@/features/admin-dashboard/api/dashboardApi', () => ({
  useFetchTeamActivityQuery: (
    ...args: Parameters<typeof useFetchTeamActivityQuery>
  ) => useFetchTeamActivityQuery(...args),
}));

vi.mock('@/features/auth/services/authSession', () => ({
  getAuthSession: () => getAuthSession(),
}));

describe('TeamHierarchySection', () => {
  beforeEach(() => {
    getAuthSession.mockReturnValue(null);
    useFetchTeamActivityQuery.mockReturnValue({
      data: { members: [] },
      isLoading: false,
      isFetching: false,
      error: undefined,
      refetch: vi.fn(),
    });
  });

  it('refetches team activity with date and geography params', () => {
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

  it('hides Area Managers tab when logged in as Area Manager', () => {
    getAuthSession.mockReturnValue({ role: 'AREA_MANAGER' });

    renderWithProviders(
      <TeamHierarchySection
        fromDate="2026-01-01"
        toDate="2026-01-31"
        geography={EMPTY_DASHBOARD_GEOGRAPHY}
        status="all"
        sortKey="default"
        onSortChange={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole('tab', { name: 'Area Managers' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: 'Program Officers' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'SKs' })).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: 'Program Officers' }),
    ).toHaveAttribute('aria-selected', 'true');
    expect(useFetchTeamActivityQuery).toHaveBeenCalledWith(
      expect.objectContaining({ depth: 1 }),
    );
  });
});
