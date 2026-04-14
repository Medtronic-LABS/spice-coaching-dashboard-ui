import * as React from 'react';
import { ResponsiveContainer } from 'recharts';
import ChartFrame from './ChartFrame';
import { ResponsiveLegend, type LegendItem } from './ResponsiveLegend';
import type { BaseChartProps } from './chart.types';

export type ChartBaseProps<TData> = BaseChartProps<TData> & {
  children: React.ReactElement;
  legendItems?: readonly LegendItem[];
  /** Override for explicit empty check if data.length === 0 isn't enough */
  isEmpty?: boolean;
};

export default function ChartBase<TData>({
  data,
  loading = false,
  error,
  height = 300,
  width,
  className,
  style,
  emptyTitle,
  emptyDescription,
  showLegend = true,
  ariaLabel,
  role,
  onClick,
  onHover,
  children,
  legendItems,
  isEmpty: explicitIsEmpty,
}: ChartBaseProps<TData>) {
  const isEmpty = explicitIsEmpty ?? data.length === 0;

  return (
    <ChartFrame
      height={height}
      width={width}
      loading={loading}
      isEmpty={isEmpty}
      className={className}
      style={style}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      error={error}
      ariaLabel={ariaLabel}
      role={role}
      onClick={onClick}
      onMouseMove={onHover}
      legend={
        showLegend && legendItems && legendItems.length > 0 ? (
          <ResponsiveLegend items={legendItems} />
        ) : null
      }
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        minHeight={0}
      >
        {children}
      </ResponsiveContainer>
    </ChartFrame>
  );
}
