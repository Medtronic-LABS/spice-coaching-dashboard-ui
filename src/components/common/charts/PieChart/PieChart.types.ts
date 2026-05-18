import type * as React from 'react';

import type { BaseChartProps } from '../chart.types';

type KeyOf<T> = Extract<keyof T, string>;

export type PieVariant = 'pie' | 'donut';

export type PieChartProps<T extends Record<string, unknown>> =
  BaseChartProps<T> & {
    valueKey: KeyOf<T>;
    nameKey: KeyOf<T>;
    colors?: string[];
    style?: React.CSSProperties;
    emptyTitle?: string;
    emptyDescription?: string;
    showLegend?: boolean;
    showTooltip?: boolean;
    showLabels?: boolean;
    variant?: PieVariant;
    innerRadius?: number;
    outerRadius?: number;
  };

export type RechartsTooltipPayloadItem = {
  dataKey?: string | number;
  name?: string;
  value?: unknown;
};

export type RechartsTooltipContentProps = {
  active?: boolean;
  payload?: RechartsTooltipPayloadItem[];
  label?: unknown;
};
