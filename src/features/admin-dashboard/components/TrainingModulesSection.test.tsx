import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TrainingModulesSection } from '@/features/admin-dashboard/components/TrainingModulesSection';
import { EMPTY_DASHBOARD_GEOGRAPHY } from '@/features/admin-dashboard/hooks/useDashboardFilters';
import {
  LONG_MODULE_TITLE,
  buildPublishedModuleCompletionsResponse,
} from '@/features/admin-dashboard/testing/publishedModuleCompletionsFixtures';
import { renderWithProviders } from '@/test-utils/render';

const refetch = vi.hoisted(() => vi.fn());
const useFetchPublishedModuleCompletionsQuery = vi.hoisted(() => vi.fn());

vi.mock(
  '@/features/admin-dashboard/api/dashboardApi',
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import('@/features/admin-dashboard/api/dashboardApi')
      >();
    return {
      ...actual,
      useFetchPublishedModuleCompletionsQuery: (
        ...args: Parameters<typeof useFetchPublishedModuleCompletionsQuery>
      ) => useFetchPublishedModuleCompletionsQuery(...args),
    };
  },
);

function mockPublishedModulesQuery(
  result: ReturnType<typeof useFetchPublishedModuleCompletionsQuery>,
) {
  useFetchPublishedModuleCompletionsQuery.mockReturnValue(result);
}

describe('TrainingModulesSection', () => {
  it('renders merged module table with progress and completion columns', () => {
    mockPublishedModulesQuery({
      data: buildPublishedModuleCompletionsResponse(2),
      isLoading: false,
      isFetching: false,
      error: undefined,
      refetch,
    });

    renderWithProviders(
      <TrainingModulesSection
        fromDate="2026-01-01"
        toDate="2026-01-31"
        geography={EMPTY_DASHBOARD_GEOGRAPHY}
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Training Modules' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Published modules with SK completion progress in the current view.',
      ),
    ).toBeInTheDocument();

    const table = screen.getByRole('table');
    expect(
      within(table).getByRole('columnheader', { name: 'Module Name' }),
    ).toBeInTheDocument();
    expect(
      within(table).getByRole('columnheader', { name: 'Launched' }),
    ).toBeInTheDocument();
    expect(
      within(table).getByRole('columnheader', { name: 'Progress' }),
    ).toBeInTheDocument();
    expect(
      within(table).getByRole('columnheader', { name: 'SKs Completed' }),
    ).toBeInTheDocument();

    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(2);

    const firstRow = rows[0]!;
    expect(within(firstRow).getByText(`${LONG_MODULE_TITLE} 0`)).toHaveClass(
      'truncate',
    );
    expect(within(firstRow).getByText('15 Jan 2026')).toBeInTheDocument();
    expect(within(firstRow).getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '10',
    );
    expect(within(firstRow).getByText('1')).toBeInTheDocument();
    expect(within(firstRow).getByText('/10')).toBeInTheDocument();
  });

  it('renders empty state when no modules are returned', () => {
    mockPublishedModulesQuery({
      data: buildPublishedModuleCompletionsResponse(0),
      isLoading: false,
      isFetching: false,
      error: undefined,
      refetch,
    });

    renderWithProviders(
      <TrainingModulesSection
        fromDate="2026-01-01"
        toDate="2026-01-31"
        geography={EMPTY_DASHBOARD_GEOGRAPHY}
      />,
    );

    expect(screen.getByText('No published modules')).toBeInTheDocument();
    expect(
      screen.getByText('No modules were published in this date range.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('returns null when the API responds with forbidden', () => {
    mockPublishedModulesQuery({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: true,
      error: { status: 403 },
      refetch,
    });

    const { container } = renderWithProviders(
      <TrainingModulesSection
        fromDate="2026-01-01"
        toDate="2026-01-31"
        geography={EMPTY_DASHBOARD_GEOGRAPHY}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('forwards geography filters to the published modules query', () => {
    mockPublishedModulesQuery({
      data: buildPublishedModuleCompletionsResponse(0),
      isLoading: false,
      isFetching: false,
      error: undefined,
      refetch,
    });

    renderWithProviders(
      <TrainingModulesSection
        fromDate="2026-01-01"
        toDate="2026-01-31"
        geography={{ ...EMPTY_DASHBOARD_GEOGRAPHY, district: 'Gazipur' }}
      />,
    );

    expect(useFetchPublishedModuleCompletionsQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        from_date: '2026-01-01',
        to_date: '2026-01-31',
        district: 'Gazipur',
      }),
    );
  });
});
