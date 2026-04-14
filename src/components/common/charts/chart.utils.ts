import type * as React from 'react';

import type { LegendItem } from './ResponsiveLegend';

export function getDefaultTooltipContentStyle(): React.CSSProperties {
  return {
    borderRadius: '8px',
    border: 'none',
    boxShadow:
      '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  };
}

export function toLegendItems(
  items: Array<{
    key: string | number;
    label: React.ReactNode;
    color?: string;
  }>,
): LegendItem[] {
  return items.map((it) => ({ key: it.key, label: it.label, color: it.color }));
}
