import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdminDashboardPage } from '@/features/admin-dashboard/pages/AdminDashboardPage';
import { renderWithProviders } from '@/test-utils/render';

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
  '@/features/admin-dashboard/components/ModulePerformanceSection',
  () => ({
    ModulePerformanceSection: () => (
      <div data-testid="module-performance-section">Module Performance</div>
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
  it('places training modules and module performance widgets in one row', () => {
    renderWithProviders(<AdminDashboardPage />);

    const training = screen.getByTestId('training-modules-section');
    const performance = screen.getByTestId('module-performance-section');

    expect(training.parentElement).toBe(performance.parentElement);
    expect(training.parentElement).toHaveClass('xl:grid-cols-2');
  });
});
