import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import PieChart from '.';

type CapturedPieProps = Record<string, unknown> | null;
let capturedPieProps: CapturedPieProps = null;
let capturedLegendItems: unknown = null;

let tooltipActive = true;
let tooltipLabel: unknown = 'My label';
let tooltipPayload: unknown[] | undefined = [
  { name: 'Completed', value: 10, dataKey: 'value' },
];

vi.mock('recharts', async () => {
  const React = await import('react');

  return {
    PieChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="recharts-piechart">{children}</div>
    ),
    Pie: (props: Record<string, unknown> & { children?: React.ReactNode }) => {
      capturedPieProps = props;
      return <div data-testid="recharts-pie">{props.children}</div>;
    },
    Cell: ({ fill }: { fill: string }) => (
      <div data-testid="recharts-cell" data-fill={fill} />
    ),
    Tooltip: ({
      content,
    }: {
      content?: React.ReactElement | null;
      contentStyle?: Record<string, unknown>;
      cursor?: unknown;
    }) => {
      if (!content) return null;
      return (
        <div data-testid="recharts-tooltip">
          {React.cloneElement(content, {
            active: tooltipActive,
            label: tooltipLabel,
            payload: tooltipPayload,
          })}
        </div>
      );
    },
  };
});

vi.mock('../ChartBase', async () => {
  return {
    default: ({
      children,
      legendItems,
    }: {
      children: React.ReactNode;
      legendItems?: unknown;
    }) => {
      capturedLegendItems = legendItems;
      return <div data-testid="chart-base">{children}</div>;
    },
  };
});

describe('PieChart', () => {
  it('renders tooltip content when enabled', () => {
    tooltipActive = true;
    tooltipLabel = 'My label';
    tooltipPayload = [{ name: 'Completed', value: 10, dataKey: 'value' }];

    render(
      <PieChart
        data={[
          { name: 'Completed', value: 10 },
          { name: 'In Progress', value: 0 },
        ]}
        valueKey="value"
        nameKey="name"
        ariaLabel="pie"
      />,
    );

    expect(screen.getByTestId('chart-base')).toBeInTheDocument();
    expect(screen.getByTestId('recharts-tooltip')).toBeInTheDocument();
    expect(screen.getByText('My label')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('handles missing p.value in tooltip payload safely', () => {
    tooltipActive = true;
    tooltipPayload = [{ name: 'Missing Value' }]; // No value provided

    render(
      <PieChart
        data={[{ name: 'Missing Value', value: 10 }]}
        valueKey="value"
        nameKey="name"
        ariaLabel="pie"
      />,
    );
    expect(screen.getByTestId('recharts-tooltip')).toBeInTheDocument();
    expect(screen.getByText('Missing Value')).toBeInTheDocument();
  });

  it('returns null tooltip content when inactive or payload empty', () => {
    tooltipActive = false;
    tooltipLabel = 'My label';
    tooltipPayload = [{ name: 'Completed', value: 10, dataKey: 'value' }];

    const { rerender } = render(
      <PieChart
        data={[{ name: 'Completed', value: 10 }]}
        valueKey="value"
        nameKey="name"
        ariaLabel="pie"
      />,
    );
    expect(screen.getByTestId('recharts-tooltip')).toBeEmptyDOMElement();

    tooltipActive = true;
    tooltipPayload = [];
    rerender(
      <PieChart
        data={[{ name: 'Completed', value: 10 }]}
        valueKey="value"
        nameKey="name"
        ariaLabel="pie"
      />,
    );
    expect(screen.getByTestId('recharts-tooltip')).toBeEmptyDOMElement();
  });

  it('renders empty tooltip label when label is not a string', () => {
    tooltipActive = true;
    tooltipLabel = 123;
    tooltipPayload = [{ name: 'Completed', value: 10, dataKey: 'value' }];

    render(
      <PieChart
        data={[{ name: 'Completed', value: 10 }]}
        valueKey="value"
        nameKey="name"
        ariaLabel="pie"
      />,
    );

    expect(screen.queryByText('My label')).not.toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('disables tooltip when showTooltip is false', () => {
    render(
      <PieChart
        data={[{ name: 'Completed', value: 10 }]}
        valueKey="value"
        nameKey="name"
        showTooltip={false}
        ariaLabel="pie"
      />,
    );
    expect(screen.queryByTestId('recharts-tooltip')).not.toBeInTheDocument();
  });

  it('computes default donut innerRadius and enables animation only when total > 0', () => {
    render(
      <PieChart
        data={[
          { name: 'Completed', value: 10 },
          { name: 'In Progress', value: 0 },
        ]}
        valueKey="value"
        nameKey="name"
        outerRadius={90}
        variant="donut"
        ariaLabel="pie"
      />,
    );

    expect(capturedPieProps?.innerRadius).toBe(60);
    expect(capturedPieProps?.outerRadius).toBe(90);
    expect(capturedPieProps?.isAnimationActive).toBe(true);
  });

  it('handles string numbers and invalid values in total calculation safely', () => {
    render(
      <PieChart
        data={[
          { name: 'String Value', value: '15' }, // A string representing a number
          { name: 'Invalid Value', value: 'foo' }, // Invalid string -> should resolve to 0
          { name: 'Missing Value' }, // No valueKey -> should resolve to 0
        ]}
        valueKey="value"
        nameKey="name"
        ariaLabel="pie"
      />,
    );

    // Total should be 15 + 0 + 0 = 15, which is > 0, so animation should be active.
    expect(capturedPieProps?.isAnimationActive).toBe(true);
  });

  it('uses pie variant innerRadius 0 and disables labels when showLabels is false', () => {
    render(
      <PieChart
        data={[{ name: 'Completed', value: 0 }]}
        valueKey="value"
        nameKey="name"
        variant="pie"
        showLabels={false}
        ariaLabel="pie"
      />,
    );

    expect(capturedPieProps?.innerRadius).toBe(0);
    expect(capturedPieProps?.label).toBe(false);
    expect(capturedPieProps?.isAnimationActive).toBe(false);
  });

  it('label renderer returns name when percent is missing', () => {
    render(
      <PieChart
        data={[{ name: 'Completed', value: 10 }]}
        valueKey="value"
        nameKey="name"
        ariaLabel="pie"
      />,
    );

    const label = capturedPieProps?.label;
    expect(typeof label).toBe('function');
    if (typeof label === 'function') {
      expect(label({ name: 'X' })).toBe('X');
      expect(label({})).toBe('');
    }
  });

  it('label renderer rounds percent when provided', () => {
    render(
      <PieChart
        data={[{ name: 'Completed', value: 10 }]}
        valueKey="value"
        nameKey="name"
        ariaLabel="pie"
      />,
    );

    const label = capturedPieProps?.label;
    expect(typeof label).toBe('function');
    if (typeof label === 'function') {
      expect(label({ name: 'X', percent: 0.123 })).toBe('X 12%');
      expect(label({ percent: 0.123 })).toBe('12%');
    }
  });

  it('legend labels fall back to empty string when missing', () => {
    render(
      <PieChart
        data={[{ value: 10 }]}
        valueKey="value"
        nameKey="name"
        ariaLabel="pie"
      />,
    );

    expect(Array.isArray(capturedLegendItems)).toBe(true);
    expect(capturedLegendItems).toEqual([
      expect.objectContaining({ label: '' }),
    ]);
  });
});
