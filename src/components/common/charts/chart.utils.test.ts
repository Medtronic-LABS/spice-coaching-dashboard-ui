import { describe, expect, it } from 'vitest';

import { getDefaultTooltipContentStyle, toLegendItems } from './chart.utils';

describe('chart.utils', () => {
  it('getDefaultTooltipContentStyle returns stable style shape', () => {
    expect(getDefaultTooltipContentStyle()).toEqual({
      borderRadius: '8px',
      border: '1px solid var(--color-border)',
      background: 'var(--color-surface)',
      color: 'var(--color-text-primary)',
      boxShadow: 'var(--shadow-overlay, var(--shadow-card-dashboard))',
    });
  });

  it('toLegendItems maps to LegendItem[]', () => {
    expect(
      toLegendItems([
        { key: 'a', label: 'Alpha', color: '#111111' },
        { key: 2, label: 'Beta' },
      ]),
    ).toEqual([
      { key: 'a', label: 'Alpha', color: '#111111' },
      { key: 2, label: 'Beta', color: undefined },
    ]);
  });
});
