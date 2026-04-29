import type * as React from 'react';

import type { LegendItem } from './ResponsiveLegend';

export function getDefaultTooltipContentStyle(): React.CSSProperties {
  return {
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    boxShadow: 'var(--shadow-overlay, var(--shadow-card-dashboard))',
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
