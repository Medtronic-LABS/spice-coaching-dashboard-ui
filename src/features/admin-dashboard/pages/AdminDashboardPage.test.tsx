import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { AdminDashboardPage } from '@/features/admin-dashboard/pages/AdminDashboardPage';
import {
  EMPTY_DASHBOARD_GEOGRAPHY,
  useDashboardFilters,
} from '@/features/admin-dashboard/hooks/useDashboardFilters';
import { renderWithProviders } from '@/test-utils/render';

vi.mock(
  '@/features/admin-dashboard/hooks/useDashboardFilters',
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import('@/features/admin-dashboard/hooks/useDashboardFilters')
      >();
    return {
      ...actual,
      useDashboardFilters: vi.fn(actual.useDashboardFilters),
    };
  },
);

vi.mock('@/features/admin-dashboard/components/DashboardKpiRow', () => ({
  DashboardKpiRow: () => <div data-testid="dashboard-kpi-row" />,
}));

vi.mock('@/features/admin-dashboard/components/TeamHierarchySection', () => ({
  TeamHierarchySection: () => <div data-testid="team-hierarchy-section" />,
}));

vi.mock('@/features/admin-dashboard/components/TrainingModulesSection', () => ({
  TrainingModulesSection: () => (
    <div data-testid="training-modules-section">Training Modules</div>
  ),
}));

vi.mock(
  '@/features/admin-dashboard/components/ModuleDemandSummaryWidget',
  () => ({
    ModuleDemandSummaryWidget: () => (
      <div data-testid="module-demand-summary-widget" />
    ),
  }),
);

vi.mock(
  '@/features/admin-dashboard/components/TopSearchedModulesWidget',
  () => ({
    TopSearchedModulesWidget: () => (
      <div data-testid="top-searched-modules-widget" />
    ),
  }),
);

vi.mock(
  '@/features/admin-dashboard/components/TopSuggestedModulesWidget',
  () => ({
    TopSuggestedModulesWidget: () => (
      <div data-testid="top-suggested-modules-widget" />
    ),
  }),
);

vi.mock('@/features/admin-dashboard/components/DocumentUsageSection', () => ({
  DocumentUsageSection: () => <div data-testid="document-usage-section" />,
}));

vi.mock('@/features/admin-dashboard/components/DashboardFilterBar', () => ({
  DashboardFilterBar: () => <div data-testid="dashboard-filter-bar" />,
}));

describe('AdminDashboardPage', () => {
  it('renders one training modules widget outside the module-demand grid', () => {
    renderWithProviders(<AdminDashboardPage />);

    const training = screen.getByTestId('training-modules-section');
    const moduleDemandGrid = screen
      .getByTestId('top-searched-modules-widget')
      .closest('.xl\\:grid-cols-2');

    expect(training).toBeInTheDocument();
    expect(training.closest('.xl\\:grid-cols-2')).toBeNull();
    expect(moduleDemandGrid).not.toBeNull();
  });

  it('orders dashboard sections from KPIs through document usage', () => {
    renderWithProviders(<AdminDashboardPage />);

    const sectionIds = [
      'dashboard-kpi-row',
      'team-hierarchy-section',
      'training-modules-section',
      'module-demand-summary-widget',
      'top-searched-modules-widget',
      'top-suggested-modules-widget',
      'document-usage-section',
    ].map((testId) => screen.getByTestId(testId));

    for (let index = 0; index < sectionIds.length - 1; index += 1) {
      const current = sectionIds[index]!;
      const next = sectionIds[index + 1]!;
      expect(
        current.compareDocumentPosition(next) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });

  it('keeps dashboard widgets visible under the invalid-range warning', () => {
    vi.mocked(useDashboardFilters).mockReturnValueOnce({
      filters: {
        durationPreset: 'custom',
        customFrom: '2026-08-01',
        customTo: '',
        geography: EMPTY_DASHBOARD_GEOGRAPHY,
      },
      dateRange: { fromDate: '2026-08-01', toDate: '' },
      queryDateRange: { fromDate: '2026-08-01', toDate: '2026-08-15' },
      isDateRangeValid: false,
      setDurationPreset: vi.fn(),
      setCustomFrom: vi.fn(),
      setCustomTo: vi.fn(),
      setGeography: vi.fn(),
      hierarchySort: 'default',
      setHierarchySort: vi.fn(),
      clearCustomDateRange: vi.fn(),
    });

    renderWithProviders(<AdminDashboardPage />);

    expect(screen.getByText('Invalid date range')).toBeVisible();
    expect(screen.getByTestId('dashboard-kpi-row')).toBeInTheDocument();
    expect(screen.getByTestId('team-hierarchy-section')).toBeInTheDocument();
    expect(screen.getByTestId('training-modules-section')).toBeInTheDocument();
    expect(
      screen.getByTestId('top-searched-modules-widget'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('top-suggested-modules-widget'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('document-usage-section')).toBeInTheDocument();
  });
});
