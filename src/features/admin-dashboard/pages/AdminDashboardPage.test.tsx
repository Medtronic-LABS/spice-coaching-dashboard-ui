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
});
