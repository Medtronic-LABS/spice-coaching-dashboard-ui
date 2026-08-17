import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { QuotedDisplayLabel } from '@/components/ui/QuotedDisplayLabel';

describe('QuotedDisplayLabel', () => {
  it('renders quoted text unchanged when short', () => {
    render(<QuotedDisplayLabel text="Safe Motherhood" />);
    expect(screen.getByText('“Safe Motherhood”')).toBeInTheDocument();
  });

  it('truncates long text with an ellipsis and exposes the full title', () => {
    const long = `Milestone ${'A'.repeat(80)}`;
    render(<QuotedDisplayLabel text={long} maxLength={20} />);
    const label = screen.getByTitle(long);
    expect(label.textContent).toContain('…');
    expect(label.textContent?.startsWith('“Milestone')).toBe(true);
  });
});
