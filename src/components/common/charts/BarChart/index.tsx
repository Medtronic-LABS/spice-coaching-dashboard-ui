import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

import * as React from 'react';
import { ChartBase } from '../ChartBase';
import { getDefaultTooltipContentStyle, toLegendItems } from '../chart.utils';
import type { BarChartProps } from './BarChart.types';

export type { BarChartMode, BarChartProps, BarSeries } from './BarChart.types';

export function BarChart({
  data,
  xAxisKey,
  series,
  mode = 'grouped',
  height = 300,
  width,
  loading = false,
  error,
  className,
  style,
  emptyTitle,
  emptyDescription,
  showLegend = true,
  showTooltip = true,
  ariaLabel,
  maxBarSize = 50,
  role,
  onClick,
  onHover,
}: BarChartProps<Record<string, unknown>>) {
  const isEmpty = data.length === 0 || series.length === 0;
  const tooltipContentStyle = React.useMemo(
    () => getDefaultTooltipContentStyle(),
    [],
  );

  const legendItems = React.useMemo(
    () =>
      toLegendItems(
        series.map((s) => ({
          key: s.key,
          label: s.label ?? String(s.key),
          color: s.color,
        })),
      ),
    [series],
  );

  return (
    <ChartBase
      data={data}
      isEmpty={isEmpty}
      height={height}
      width={width}
      loading={loading}
      error={error}
      className={className}
      style={style}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      showLegend={showLegend}
      ariaLabel={ariaLabel}
      role={role}
      onClick={onClick}
      onHover={onHover}
      legendItems={legendItems}
    >
      <RechartsBarChart
        data={data}
        margin={{ top: 16, right: 16, left: 8, bottom: 28 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="#E5E7EB"
        />
        <XAxis
          dataKey={xAxisKey}
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#6B7280', fontSize: 12 }}
          dy={10}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#6B7280', fontSize: 12 }}
          dx={-10}
        />
        {showTooltip ? (
          <Tooltip
            cursor={{ fill: '#F3F4F6' }}
            contentStyle={tooltipContentStyle}
          />
        ) : null}
        {series.map((s) => (
          <Bar
            key={String(s.key)}
            dataKey={s.key}
            name={s.label ?? String(s.key)}
            fill={s.color}
            radius={[4, 4, 0, 0]}
            maxBarSize={maxBarSize}
            stackId={mode === 'stacked' ? 'stack' : undefined}
          />
        ))}
      </RechartsBarChart>
    </ChartBase>
  );
}
