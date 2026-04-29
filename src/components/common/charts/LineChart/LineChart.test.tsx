import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LineChart } from '.';

let capturedXAxisProps: Record<string, unknown> | null = null;
let capturedTooltipProps: Record<string, unknown> | null = null;
let capturedLineProps: Array<Record<string, unknown>> = [];

vi.mock('recharts', async () => {
  const React = await import('react');

  return {
    LineChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="recharts-linechart">{children}</div>
    ),
    Line: (props: Record<string, unknown>) => {
      capturedLineProps.push(props);
      return <div data-testid="recharts-line" />;
    },
    XAxis: (props: Record<string, unknown>) => {
      capturedXAxisProps = props;
      return <div data-testid="recharts-xaxis" />;
    },
    YAxis: () => <div data-testid="recharts-yaxis" />,
    CartesianGrid: () => <div data-testid="recharts-grid" />,
    Tooltip: (props: Record<string, unknown>) => {
      capturedTooltipProps = props;
      return <div data-testid="recharts-tooltip" />;
    },
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

describe('LineChart', () => {
  it('uses xAxisKey and renders tooltip by default', () => {
    capturedLineProps = [];
    capturedTooltipProps = null;
    capturedXAxisProps = null;

    render(
      <LineChart
        data={[{ month: 'Jan', a: 1 }]}
        xAxisKey="month"
        series={[{ key: 'a', color: '#111111', label: 'Series A' }]}
        ariaLabel="line"
      />,
    );

    expect(screen.getByTestId('chart-base')).toBeInTheDocument();
    expect(capturedXAxisProps?.dataKey).toBe('month');
    expect(screen.getByTestId('recharts-tooltip')).toBeInTheDocument();
    expect(capturedTooltipProps?.contentStyle).toEqual(
      expect.objectContaining({
        borderRadius: '8px',
        border: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
      }),
    );
    expect(capturedLineProps).toHaveLength(1);
    expect(capturedLineProps[0].type).toBe('monotone');
    expect(capturedLineProps[0].dot).toEqual(
      expect.objectContaining({ r: 3, strokeWidth: 2 }),
    );
  });

  it('can disable tooltip and dot', () => {
    capturedLineProps = [];

    render(
      <LineChart
        data={[{ month: 'Jan', a: 1 }]}
        xAxisKey="month"
        series={[{ key: 'a', color: '#111111', showDot: false }]}
        showTooltip={false}
        ariaLabel="line"
      />,
    );

    expect(screen.queryByTestId('recharts-tooltip')).not.toBeInTheDocument();
    expect(capturedLineProps).toHaveLength(1);
    expect(capturedLineProps[0].dot).toBe(false);
  });
});
