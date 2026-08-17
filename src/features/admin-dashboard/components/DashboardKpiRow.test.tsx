import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DashboardKpiRow } from '@/features/admin-dashboard/components/DashboardKpiRow';
import { EMPTY_DASHBOARD_GEOGRAPHY } from '@/features/admin-dashboard/hooks/useDashboardFilters';
import { PUBLISHED_MODULE_COMPLETIONS_QUERY_LIMIT } from '@/features/admin-dashboard/utils/dashboardQueryArgs';
import { renderWithProviders } from '@/test-utils/render';

const refetchTeam = vi.hoisted(() => vi.fn());
const refetchModules = vi.hoisted(() => vi.fn());

vi.mock('@/features/admin-dashboard/api/dashboardApi', () => ({
  useFetchTeamActivityQuery: (args: Record<string, unknown>) => {
    expect(args).toEqual({
      from_date: '2026-01-01',
      to_date: '2026-01-31',
      limit: 1,
      offset: 0,
      district: 'Gazipur',
    });

    return {
      data: {
        summary: {
          total_users: 3,
          active_users: 3,
          non_active_users: 0,
          users_completed_module: 2,
          users_chatbot_engaged: 1,
        },
      },
      isLoading: false,
      isFetching: false,
      error: undefined,
      refetch: refetchTeam,
    };
  },
  useFetchPublishedModuleCompletionsQuery: (args: Record<string, unknown>) => {
    expect(args).toEqual({
      from_date: '2026-01-01',
      to_date: '2026-01-31',
      limit: PUBLISHED_MODULE_COMPLETIONS_QUERY_LIMIT,
      offset: 0,
      district: 'Gazipur',
    });

    return {
      data: {
        total_modules: 12,
        modules: [],
      },
      isLoading: false,
      isFetching: false,
      error: undefined,
      refetch: refetchModules,
    };
  },
}));

describe('DashboardKpiRow', () => {
  it('refetches KPI queries with date and geography params', () => {
    renderWithProviders(
      <DashboardKpiRow
        fromDate="2026-01-01"
        toDate="2026-01-31"
        geography={{ ...EMPTY_DASHBOARD_GEOGRAPHY, district: 'Gazipur' }}
      />,
    );

    expect(screen.getByText('Responsive SKs')).toBeInTheDocument();
    expect(screen.getByText('Non-Responsive SKs')).toBeInTheDocument();
    expect(screen.getByText('SKs completed a module')).toBeInTheDocument();
    expect(screen.getByText('Published training modules')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });
});
