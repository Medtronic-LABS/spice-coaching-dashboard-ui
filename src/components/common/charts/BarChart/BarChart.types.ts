import type * as React from 'react';

import type { BaseChartProps } from '../chart.types';

type KeyOf<T> = Extract<keyof T, string>;

export type BarSeries<T> = {
  key: KeyOf<T>;
  color: string;
  label?: string;
};

export type BarChartMode = 'grouped' | 'stacked';

export type BarChartProps<T extends Record<string, unknown>> =
  BaseChartProps<T> & {
    xAxisKey: KeyOf<T>;
    series: Array<BarSeries<T>>;
    mode?: BarChartMode;
    style?: React.CSSProperties;
    emptyTitle?: string;
    emptyDescription?: string;
    showLegend?: boolean;
    showTooltip?: boolean;
    maxBarSize?: number;
  };
