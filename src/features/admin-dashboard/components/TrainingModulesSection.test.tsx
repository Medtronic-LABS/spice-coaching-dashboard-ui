import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TrainingModulesSection } from '@/features/admin-dashboard/components/TrainingModulesSection';
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
        data: buildPublishedModuleCompletionsResponse(2),
        isLoading: false,
        isFetching: false,
        error: undefined,
        refetch,
      }),
    };
  },
);

describe('TrainingModulesSection', () => {
  it('renders module titles with truncated text styling', () => {
    renderWithProviders(
      <TrainingModulesSection fromDate="2026-01-01" toDate="2026-01-31" />,
    );

    const content = screen.getByText(`${LONG_MODULE_TITLE} 0`);
    expect(content).toHaveClass('truncate');
    expect(
      screen.getByRole('columnheader', { name: 'Module Name' }),
    ).toBeInTheDocument();
    expect(screen.getByText('1/10')).toBeInTheDocument();
  });
});
