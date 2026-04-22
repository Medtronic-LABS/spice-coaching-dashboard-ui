import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InsightCard } from './InsightCard';

describe('InsightCard', () => {
  it('returns null when required fields are missing', () => {
    const { container } = render(
      <InsightCard
        title=""
        description="x"
        actionLabel="Do"
        onAction={() => undefined}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders and triggers action', () => {
    const onAction = vi.fn();
    render(
      <InsightCard
        title="Tip"
        description="Do a thing"
        actionLabel="Action"
        onAction={onAction}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Action' }));
    expect(onAction).toHaveBeenCalled();
  });
});
