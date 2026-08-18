import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DashboardFilterBar } from '@/features/admin-dashboard/components/DashboardFilterBar';
import {
  DEFAULT_DASHBOARD_FILTERS,
  EMPTY_DASHBOARD_GEOGRAPHY,
} from '@/features/admin-dashboard/hooks/useDashboardFilters';
import { todayDateInputValue } from '@/utils/dateInput';

const fetchUpazilasPage = vi.hoisted(() =>
  vi.fn(() => ({
    unwrap: () =>
      Promise.resolve({
        upazilas: [],
      }),
  })),
);

vi.mock('@/features/modules/api/adminAssignmentApi', () => ({
  useFetchAdminDistrictsQuery: () => ({ data: [] }),
  useFetchAdminDivisionsQuery: () => ({ data: [] }),
  useLazyFetchAdminUpazilasPageQuery: () => [fetchUpazilasPage],
}));

describe('DashboardFilterBar', () => {
  it('caps custom From and To date pickers at today', () => {
    render(
      <DashboardFilterBar
        filters={{
          ...DEFAULT_DASHBOARD_FILTERS,
          durationPreset: 'custom',
          customFrom: '2026-04-01',
          customTo: '2026-04-10',
          geography: EMPTY_DASHBOARD_GEOGRAPHY,
        }}
        onDurationChange={vi.fn()}
        onCustomFromChange={vi.fn()}
        onCustomToChange={vi.fn()}
        onStatusChange={vi.fn()}
        onGeographyChange={vi.fn()}
      />,
    );

    const today = todayDateInputValue();
    expect(screen.getByLabelText('From')).toHaveAttribute('max', today);
    expect(screen.getByLabelText('To')).toHaveAttribute('max', today);
  });
});
