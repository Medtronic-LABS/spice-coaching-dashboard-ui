import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ModuleDemandSummaryWidget } from '@/features/admin-dashboard/components/ModuleDemandSummaryWidget';
import { EMPTY_DASHBOARD_GEOGRAPHY } from '@/features/admin-dashboard/hooks/useDashboardFilters';
import { renderWithProviders } from '@/test-utils/render';

const mocks = vi.hoisted(() => ({
  useFetchModuleDemandSummaryQuery: vi.fn(),
}));

vi.mock('@/features/admin-dashboard/api/dashboardApi', () => ({
  useFetchModuleDemandSummaryQuery: mocks.useFetchModuleDemandSummaryQuery,
}));

describe('ModuleDemandSummaryWidget', () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      get() {
        return 48;
      },
    });
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get() {
        return 120;
      },
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'clientHeight');
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollHeight');
  });

  it('renders the summary prose with a refresh control', () => {
    mocks.useFetchModuleDemandSummaryQuery.mockReturnValue({
      data: {
        from_date: '2026-07-01',
        to_date: '2026-07-31',
        summary:
          'Between 2026-07-01 to 2026-07-31, CHWs in your scope used digital help most on: Neonatal danger signs (45 digital-help, 8 requests).',
      },
      isLoading: false,
      isFetching: false,
      isError: false,
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
      screen.getByText(
        /Neonatal danger signs \(45 digital-help, 8 requests\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /refresh/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/module demand summary/i),
    ).not.toBeInTheDocument();
  });

  it('toggles between see more and see less when summary overflows', async () => {
    const user = userEvent.setup();
    mocks.useFetchModuleDemandSummaryQuery.mockReturnValue({
      data: {
        from_date: '2026-07-01',
        to_date: '2026-07-31',
        summary:
          'Between 2026-07-01 to 2026-07-31, CHWs in your scope used digital help most on: Neonatal danger signs (45 digital-help, 8 requests). Additional context keeps this summary long enough to clamp across three lines before revealing the rest of the narrative.',
      },
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(
      <ModuleDemandSummaryWidget
        fromDate="2026-07-01"
        toDate="2026-07-31"
        geography={EMPTY_DASHBOARD_GEOGRAPHY}
      />,
    );

    const seeMore = await screen.findByRole('button', { name: /see more/i });
    await user.click(seeMore);
    expect(
      screen.getByRole('button', { name: /see less/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /see less/i }));
    expect(
      screen.getByRole('button', { name: /see more/i }),
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

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
});
