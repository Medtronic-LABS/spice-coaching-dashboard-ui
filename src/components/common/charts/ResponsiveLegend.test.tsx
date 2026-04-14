import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ResponsiveLegend } from './ResponsiveLegend';

describe('ResponsiveLegend', () => {
  it('returns null when items is empty/undefined', () => {
    const { container: c1 } = render(<ResponsiveLegend items={undefined} />);
    expect(c1).toBeEmptyDOMElement();

    const { container: c2 } = render(<ResponsiveLegend items={[]} />);
    expect(c2).toBeEmptyDOMElement();
  });

  it('renders list items with fallback color and aria labels', () => {
    render(
      <ResponsiveLegend
        ariaLabel="Legend label"
        items={[
          { key: 'a', label: 'Alpha', color: '#ff0000' },
          { key: 2, label: 'Beta' }, // fallback color
          { key: 3, label: <span>Gamma</span> },
        ]}
      />,
    );

    const list = screen.getByRole('list', { name: 'Legend label' });
    const items = screen.getAllByRole('listitem');
    expect(list).toBeInTheDocument();
    expect(items).toHaveLength(3);

    // string label -> aria-label on list item
    expect(screen.getByRole('listitem', { name: 'Alpha' })).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: 'Beta' })).toBeInTheDocument();
    // non-string label -> no accessible name
    expect(items.some((el) => el.getAttribute('aria-label') === 'Gamma')).toBe(
      false,
    );
  });
});
