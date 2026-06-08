import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Home } from '@/features/home/pages/Home';

vi.mock('@/constants/role', () => ({
  getCurrentRole: () => 'supervisor' as const,
}));

vi.mock('@/components/common/charts', async () => {
  return {
    BarChart: ({ ariaLabel }: { ariaLabel: string }) => (
      <div aria-label={ariaLabel}>BarChart</div>
    ),
    LineChart: ({ ariaLabel }: { ariaLabel: string }) => (
      <div aria-label={ariaLabel}>LineChart</div>
    ),
    PieChart: ({ ariaLabel }: { ariaLabel: string }) => (
      <div aria-label={ariaLabel}>PieChart</div>
    ),
  };
});

vi.mock('@/features/home/components/SupervisorDashboard', () => ({
  SupervisorDashboard: () => <div>SupervisorDashboard</div>,
}));

describe('Home', () => {
  it('renders supervisor dashboard for supervisor role', () => {
    render(<Home />);

    expect(screen.getByText('SupervisorDashboard')).toBeInTheDocument();
  });
});
