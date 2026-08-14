import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ModulePerformanceSection } from '@/features/admin-dashboard/components/ModulePerformanceSection';
import { MODULE_PERFORMANCE_DISPLAY_LIMIT } from '@/features/admin-dashboard/utils/publishedModuleCompletions';
import {
  LONG_MODULE_TITLE,
  buildPublishedModuleCompletionsResponse,
} from '@/features/admin-dashboard/testing/publishedModuleCompletionsFixtures';
import { renderWithProviders } from '@/test-utils/render';

const refetch = vi.hoisted(() => vi.fn());

vi.mock(
  '@/features/admin-dashboard/api/dashboardApi',
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import('@/features/admin-dashboard/api/dashboardApi')
      >();
    return {
      ...actual,
      useFetchPublishedModuleCompletionsQuery: () => ({
        data: buildPublishedModuleCompletionsResponse(25),
        isLoading: false,
        isFetching: false,
        error: undefined,
        refetch,
      }),
    };
  },
);

describe('ModulePerformanceSection', () => {
  it('renders truncated module titles and completion counts with text-sm styling', () => {
    renderWithProviders(
      <ModulePerformanceSection fromDate="2026-01-01" toDate="2026-01-31" />,
    );

    const firstRow = within(screen.getByRole('list')).getAllByRole(
      'listitem',
    )[0]!;
    const content = within(firstRow).getByText(`${LONG_MODULE_TITLE} 0`);
    expect(content).toHaveClass('truncate', 'text-sm', 'font-medium');

    const count = within(firstRow).getByText('1', { selector: 'span' });
    expect(count).toHaveClass('text-sm', 'font-semibold');
    expect(within(firstRow).getByText('/10')).toHaveClass(
      'text-spice-text-muted',
    );
  });

  it('limits visible rows to the performance widget display cap', () => {
    renderWithProviders(
      <ModulePerformanceSection fromDate="2026-01-01" toDate="2026-01-31" />,
    );

    expect(
      screen.getByRole('heading', { name: 'Module Performance' }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('list')).getAllByRole('listitem'),
    ).toHaveLength(MODULE_PERFORMANCE_DISPLAY_LIMIT);
  });
});
