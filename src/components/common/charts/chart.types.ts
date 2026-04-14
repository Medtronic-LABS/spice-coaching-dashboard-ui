import type * as React from 'react';

/**
 * Common accessibility requirements for all charts.
 */
export type ChartAccessibilityProps = {
  /**
   * Accessible name for the chart container.
   * STRICTLY REQUIRED to prevent unlabeled chart renders.
   * Example: "Student engagement by month (bar chart)"
   */
  ariaLabel: string;
  /**
   * Defaults to "img" so assistive tech treats the chart as a single graphic.
   */
  role?: React.AriaRole;
};

export type ChartInteractionProps = {
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  onHover?: React.MouseEventHandler<HTMLDivElement>;
};

export type BaseChartProps<TData> = ChartAccessibilityProps &
  ChartInteractionProps & {
    data: TData[];
    loading?: boolean;
    error?: React.ReactNode;
    height?: number;
    width?: number | string;
    className?: string;
    style?: React.CSSProperties;
    emptyTitle?: string;
    emptyDescription?: string;
    showLegend?: boolean;
    showTooltip?: boolean;
  };
