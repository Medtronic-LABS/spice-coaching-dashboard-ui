import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ModuleDemandSummaryWidget } from '@/features/admin-dashboard/components/ModuleDemandSummaryWidget';
import { EMPTY_DASHBOARD_GEOGRAPHY } from '@/features/admin-dashboard/hooks/useDashboardFilters';
import { renderWithProviders } from '@/test-utils/render';

const mocks = vi.hoisted(() => ({
  useFetchModuleDemandSummaryQuery: vi.fn(),
}));

vi.mock('@/features/admin-dashboard/api/dashboardApi', () => ({
  useFetchModuleDemandSummaryQuery: mocks.useFetchModuleDemandSummaryQuery,
}));

const STRUCTURED_SUMMARY = {
  from_date: '2026-08-01',
  to_date: '2026-08-18',
  title: 'Insights from Module Usage',
  date_label: 'Aug 1–18, 2026',
  narrative:
    'Most demand can be addressed with existing or draft content. Prioritize assigning high-demand published modules, publish matching drafts to close immediate gaps, and create new content only for topics with no existing coverage.',
  empty_message: null,
  demand_pattern: [
    {
      bucket: 'assign' as const,
      title: 'Existing coverage',
      description: 'Demand is concentrated around a few published modules',
    },
    {
      bucket: 'publish' as const,
      title: 'Ready to publish',
      description: 'Some unanswered demand already has draft content',
    },
    {
      bucket: 'create' as const,
      title: 'Content gaps',
      description: 'Remaining demand represents opportunities for new modules',
    },
  ],
};

describe('ModuleDemandSummaryWidget', () => {
  it('renders structured summary with narrative and demand pattern', () => {
    mocks.useFetchModuleDemandSummaryQuery.mockReturnValue({
      data: STRUCTURED_SUMMARY,
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(
      <ModuleDemandSummaryWidget
        fromDate="2026-08-01"
        toDate="2026-08-18"
        geography={EMPTY_DASHBOARD_GEOGRAPHY}
      />,
    );

    expect(
      screen.getByRole('heading', {
        name: /insights from module usage/i,
        level: 3,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Aug 1–18, 2026')).toBeInTheDocument();
    expect(
      screen.getByText(
        /most demand can be addressed with existing or draft content/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/demand pattern/i)).toBeInTheDocument();
    expect(screen.getByText('Existing coverage')).toBeInTheDocument();
    expect(
      screen.getByText(
        /demand is concentrated around a few published modules/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Ready to publish')).toBeInTheDocument();
    expect(screen.getByText('Content gaps')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /refresh/i }),
    ).toBeInTheDocument();
  });

  it('shows empty_message when the summary has no structured content', () => {
    mocks.useFetchModuleDemandSummaryQuery.mockReturnValue({
      data: {
        from_date: '2026-08-01',
        to_date: '2026-08-18',
        title: '',
        date_label: '',
        narrative: '',
        empty_message: 'No module demand in this range.',
        demand_pattern: [],
      },
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(
      <ModuleDemandSummaryWidget
        fromDate="2026-08-01"
        toDate="2026-08-18"
        geography={EMPTY_DASHBOARD_GEOGRAPHY}
      />,
    );

    expect(
      screen.getByText('No module demand in this range.'),
    ).toBeInTheDocument();
  });

  it('shows error retry when the query fails without data', () => {
    mocks.useFetchModuleDemandSummaryQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: true,
      refetch: vi.fn(),
    });

    renderWithProviders(
      <ModuleDemandSummaryWidget
        fromDate="2026-07-01"
        toDate="2026-07-31"
        geography={EMPTY_DASHBOARD_GEOGRAPHY}
      />,
    );

    expect(
      screen.getByRole('button', { name: /try again/i }),
    ).toBeInTheDocument();
  });
});
