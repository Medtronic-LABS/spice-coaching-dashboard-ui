import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BarChart } from '.';

let capturedXAxisProps: Record<string, unknown> | null = null;
let capturedBarProps: Array<Record<string, unknown>> = [];

vi.mock('recharts', async () => {
  const React = await import('react');

  return {
    BarChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="recharts-barchart">{children}</div>
    ),
    Bar: (props: Record<string, unknown>) => {
      capturedBarProps.push(props);
      return <div data-testid="recharts-bar" />;
    },
    XAxis: (props: Record<string, unknown>) => {
      capturedXAxisProps = props;
      return <div data-testid="recharts-xaxis" />;
    },
    YAxis: () => <div data-testid="recharts-yaxis" />,
    CartesianGrid: () => <div data-testid="recharts-grid" />,
    Tooltip: () => <div data-testid="recharts-tooltip" />,
  };
});

vi.mock('../ChartBase', async () => {
  const React = await import('react');
  return {
    ChartBase: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="chart-base">{children}</div>
    ),
  };
});

describe('BarChart', () => {
  it('sets stackId only in stacked mode and applies maxBarSize', () => {
    capturedBarProps = [];
    capturedXAxisProps = null;

    render(
      <BarChart
        data={[{ month: 'Jan', a: 1, b: 2 }]}
        xAxisKey="month"
        series={[
          { key: 'a', color: '#111111' },
          { key: 'b', color: '#222222', label: 'B' },
        ]}
        mode="stacked"
        maxBarSize={33}
        ariaLabel="bar"
      />,
    );

    expect(screen.getByTestId('chart-base')).toBeInTheDocument();
    expect(capturedXAxisProps?.dataKey).toBe('month');
    expect(screen.getByTestId('recharts-tooltip')).toBeInTheDocument();
    expect(capturedBarProps).toHaveLength(2);
    expect(capturedBarProps[0].stackId).toBe('stack');
    expect(capturedBarProps[0].maxBarSize).toBe(33);
    expect(capturedBarProps[1].name).toBe('B');
  });

  it('does not set stackId in grouped mode', () => {
    capturedBarProps = [];

    render(
      <BarChart
        data={[{ month: 'Jan', a: 1 }]}
        xAxisKey="month"
        series={[{ key: 'a', color: '#111111' }]}
        mode="grouped"
        ariaLabel="bar"
      />,
    );

    expect(capturedBarProps).toHaveLength(1);
    expect(capturedBarProps[0].stackId).toBeUndefined();
  });

  it('can disable tooltip', () => {
    render(
      <BarChart
        data={[{ month: 'Jan', a: 1 }]}
        xAxisKey="month"
        series={[{ key: 'a', color: '#111111' }]}
        showTooltip={false}
        ariaLabel="bar"
      />,
    );
    expect(screen.queryByTestId('recharts-tooltip')).not.toBeInTheDocument();
  });
});
