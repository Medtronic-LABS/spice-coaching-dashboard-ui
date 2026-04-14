import { describe, expect, it } from 'vitest';

import { getDefaultTooltipContentStyle, toLegendItems } from './chart.utils';

describe('chart.utils', () => {
  it('getDefaultTooltipContentStyle returns stable style shape', () => {
    expect(getDefaultTooltipContentStyle()).toEqual({
      borderRadius: '8px',
      border: 'none',
      boxShadow:
        '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
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
