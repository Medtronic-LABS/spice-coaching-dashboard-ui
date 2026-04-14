import type * as React from 'react';
import type { CurveType } from 'recharts/types/shape/Curve';

import type { BaseChartProps } from '../chart.types';

type KeyOf<T> = Extract<keyof T, string>;

export type LineSeries<T> = {
  key: KeyOf<T>;
  color: string;
  label?: string;
  type?: CurveType;
  strokeWidth?: number;
  showDot?: boolean;
};

export type LineChartProps<T extends Record<string, unknown>> =
  BaseChartProps<T> & {
    xAxisKey: KeyOf<T>;
    series: Array<LineSeries<T>>;
    style?: React.CSSProperties;
    emptyTitle?: string;
    emptyDescription?: string;
    showLegend?: boolean;
    showTooltip?: boolean;
  };
