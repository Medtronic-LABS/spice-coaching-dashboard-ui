import { PieChart as RechartsPieChart, Pie, Cell, Tooltip } from 'recharts';

import * as React from 'react';
import ChartBase from '../ChartBase';
import { toLegendItems } from '../chart.utils';
import type {
  PieChartProps,
  RechartsTooltipContentProps,
} from './PieChart.types';

export type { PieChartProps, PieVariant } from './PieChart.types';

const DEFAULT_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
];

function DefaultTooltipContent({
  active,
  payload,
  label,
}: RechartsTooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg bg-white p-2 text-xs shadow-md ring-1 ring-slate-200">
      <div className="font-medium">
        {typeof label === 'string' ? label : ''}
      </div>
      <div className="mt-1 space-y-0.5">
        {payload.map((p) => (
          <div
            key={String(p.dataKey ?? p.name ?? '')}
            className="flex items-center justify-between gap-3"
          >
            <span className="text-slate-600">{p.name}</span>
            <span className="font-medium">{String(p.value ?? '')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PieChart({
  data,
  valueKey,
  nameKey,
  colors = DEFAULT_COLORS,
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
  showLabels = true,
  variant = 'donut',
  innerRadius,
  outerRadius = 90,
  ariaLabel,
  role,
  onClick,
  onHover,
}: PieChartProps<Record<string, unknown>>) {
  const isEmpty = data.length === 0;
  const resolvedInnerRadius =
    innerRadius ?? (variant === 'donut' ? Math.max(0, outerRadius - 30) : 0);

  const total = React.useMemo(() => {
    return data.reduce((acc, item) => {
      const raw = item[valueKey];
      const n = typeof raw === 'number' ? raw : Number(raw);
      return acc + (Number.isFinite(n) ? n : 0);
    }, 0);
  }, [data, valueKey]);

  const labelRenderer = React.useCallback(
    (props: { name?: string; percent?: number }) => {
      const pct =
        typeof props.percent === 'number'
          ? Math.round(props.percent * 100)
          : undefined;
      if (pct === undefined) return props.name ?? '';
      return `${props.name ?? ''} ${pct}%`.trim();
    },
    [],
  );

  const legendItems = React.useMemo(
    () =>
      toLegendItems(
        data.map((item, index) => ({
          key: index,
          label: String(item[nameKey] ?? ''),
          color: colors[index % colors.length],
        })),
      ),
    [data, nameKey, colors],
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
      <RechartsPieChart margin={{ top: 16, right: 16, left: 16, bottom: 16 }}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={resolvedInnerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey={valueKey}
          nameKey={nameKey}
          label={showLabels ? labelRenderer : false}
          isAnimationActive={total > 0}
        >
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={colors[index % colors.length]}
              stroke="transparent"
            />
          ))}
        </Pie>
        {showTooltip ? <Tooltip content={<DefaultTooltipContent />} /> : null}
      </RechartsPieChart>
    </ChartBase>
  );
}
