import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

import * as React from 'react';
import ChartBase from '../ChartBase';
import { getDefaultTooltipContentStyle, toLegendItems } from '../chart.utils';
import type { LineChartProps } from './LineChart.types';

export type { LineChartProps, LineSeries } from './LineChart.types';

export default function LineChart({
  data,
  xAxisKey,
  series,
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
  role,
  onClick,
  onHover,
}: LineChartProps<Record<string, unknown>>) {
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
      <RechartsLineChart
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
        {showTooltip ? <Tooltip contentStyle={tooltipContentStyle} /> : null}
        {series.map((s) => (
          <Line
            key={String(s.key)}
            type={s.type ?? 'monotone'}
            dataKey={s.key}
            name={s.label ?? String(s.key)}
            stroke={s.color}
            strokeWidth={s.strokeWidth ?? 3}
            activeDot={{ r: 6 }}
            dot={s.showDot === false ? false : { r: 3, strokeWidth: 2 }}
          />
        ))}
      </RechartsLineChart>
    </ChartBase>
  );
}
