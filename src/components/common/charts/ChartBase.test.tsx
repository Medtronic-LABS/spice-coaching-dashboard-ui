import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ChartBase from './ChartBase';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

describe('ChartBase', () => {
  it('uses explicit isEmpty override', () => {
    render(
      <ChartBase data={[{ x: 1 }]} isEmpty ariaLabel="chart" legendItems={[]}>
        <div>Child</div>
      </ChartBase>,
    );

    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('renders legend when enabled and legendItems are present', () => {
    render(
      <ChartBase
        data={[{ x: 1 }]}
        ariaLabel="chart"
        showLegend
        legendItems={[
          { key: 'a', label: 'Alpha', color: '#ff0000' },
          { key: 'b', label: 'Beta', color: '#00ff00' },
        ]}
      >
        <div>Child</div>
      </ChartBase>,
    );

    expect(screen.getByText('Child')).toBeInTheDocument();
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(
      screen.getByRole('list', { name: 'Chart legend' }),
    ).toBeInTheDocument();
  });

  it('does not render legend when showLegend is false', () => {
    render(
      <ChartBase
        data={[{ x: 1 }]}
        ariaLabel="chart"
        showLegend={false}
        legendItems={[{ key: 'a', label: 'Alpha', color: '#ff0000' }]}
      >
        <div>Child</div>
      </ChartBase>,
    );

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
