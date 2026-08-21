import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TrainingModulesSection } from '@/features/admin-dashboard/components/TrainingModulesSection';
import { EMPTY_DASHBOARD_GEOGRAPHY } from '@/features/admin-dashboard/hooks/useDashboardFilters';
import {
  LONG_MODULE_TITLE,
  buildPublishedModuleCompletionItem,
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

function idlePublishedModulesQuery(
  modules: ReturnType<typeof buildPublishedModuleCompletionItem>[],
) {
  return {
    data: {
      ...buildPublishedModuleCompletionsResponse(0),
      total_modules: modules.length,
      modules,
    },
    isLoading: false,
    isFetching: false,
    isError: false,
    error: undefined,
    refetch,
  };
}

function mockPublishedModulesQuery(
  result: ReturnType<typeof useFetchPublishedModuleCompletionsQuery>,
) {
  useFetchPublishedModuleCompletionsQuery.mockReturnValue(result);
}

beforeEach(() => {
  useFetchPublishedModuleCompletionsQuery.mockReset();
  refetch.mockReset();
});

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
      screen.getByText('Published modules with SK completion progress.'),
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
        geography={{
          ...EMPTY_DASHBOARD_GEOGRAPHY,
          districtId: '10',
        }}
      />,
    );

    expect(useFetchPublishedModuleCompletionsQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        from_date: '2026-01-01',
        to_date: '2026-01-31',
        district_id: 10,
      }),
    );
  });

  it('refreshes completion counts when the same module_ids return updated metrics after a date change', async () => {
    const user = userEvent.setup();
    const highCompletion = buildPublishedModuleCompletionItem(0, {
      completed_sk_count: 8,
      assigned_sk_count: 10,
    });
    const lowCompletion = buildPublishedModuleCompletionItem(0, {
      completed_sk_count: 1,
      assigned_sk_count: 10,
    });

    useFetchPublishedModuleCompletionsQuery.mockImplementation(
      (args: { from_date?: string }) =>
        idlePublishedModulesQuery(
          args.from_date === '2026-08-01' ? [lowCompletion] : [highCompletion],
        ),
    );

    function DateRangeHarness() {
      const [fromDate, setFromDate] = useState('2026-08-21');
      const [toDate, setToDate] = useState('2026-08-21');
      return (
        <>
          <button
            type="button"
            onClick={() => {
              setFromDate('2026-08-01');
              setToDate('2026-08-01');
            }}
          >
            Apply Aug 1
          </button>
          <TrainingModulesSection
            fromDate={fromDate}
            toDate={toDate}
            geography={EMPTY_DASHBOARD_GEOGRAPHY}
          />
        </>
      );
    }

    renderWithProviders(<DateRangeHarness />);

    const table = screen.getByRole('table');
    const firstRow = within(table).getAllByRole('row')[1]!;
    expect(within(firstRow).getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '80',
    );
    expect(within(firstRow).getByText('8')).toBeInTheDocument();
    expect(within(firstRow).getByText('/10')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Apply Aug 1' }));

    await waitFor(() => {
      const updatedRow = within(screen.getByRole('table')).getAllByRole(
        'row',
      )[1]!;
      expect(within(updatedRow).getByRole('progressbar')).toHaveAttribute(
        'aria-valuenow',
        '10',
      );
      expect(within(updatedRow).getByText('1')).toBeInTheDocument();
    });
    expect(
      within(screen.getByRole('table')).queryByText('8'),
    ).not.toBeInTheDocument();
  });
});
