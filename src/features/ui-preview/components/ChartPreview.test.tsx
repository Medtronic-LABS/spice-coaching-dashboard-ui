import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/common/charts/BarChart', () => ({
  BarChart: ({ ariaLabel }: { ariaLabel: string }) => (
    <div aria-label={ariaLabel}>BarChart</div>
  ),
}));
vi.mock('@/components/common/charts/LineChart', () => ({
  LineChart: ({ ariaLabel }: { ariaLabel: string }) => (
    <div aria-label={ariaLabel}>LineChart</div>
  ),
}));
vi.mock('@/components/common/charts/PieChart', () => ({
  PieChart: ({ ariaLabel }: { ariaLabel: string }) => (
    <div aria-label={ariaLabel}>PieChart</div>
  ),
}));

import { ChartPreview } from './ChartPreview';

describe('ChartPreview', () => {
  it('renders preview sections and chart placeholders', () => {
    render(<ChartPreview />);

    expect(
      screen.getByRole('heading', { name: 'Dashboard' }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/engagement by month \(bar chart\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/engagement trend by month \(line chart\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/module status distribution \(pie chart\)/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/recent modules \(table\)/i)).toBeInTheDocument();

    // Score rendering branches (>=90 green, >=80 yellow, else red).
    expect(screen.getByText('95%')).toHaveClass('text-spice-semantic-success');
    expect(screen.getByText('88%')).toHaveClass('text-spice-semantic-warning');
    expect(screen.getByText('72%')).toHaveClass('text-spice-semantic-error');
  });
});
