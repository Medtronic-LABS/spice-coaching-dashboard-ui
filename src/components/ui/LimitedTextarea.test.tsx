import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LimitedTextarea } from '@/components/ui/LimitedTextarea';

describe('LimitedTextarea', () => {
  it('shows a character counter and blocks input beyond maxLength', () => {
    const onChange = vi.fn();
    render(
      <LimitedTextarea
        id="description"
        value="Hello"
        maxLength={10}
        onChange={onChange}
      />,
    );

    expect(screen.getByText('5/10')).toBeInTheDocument();

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Hello world' } });
    expect(onChange).toHaveBeenCalledWith('Hello world');
    expect(input).toHaveAttribute('maxLength', '10');
  });

  it('omits the character counter when showCounter is false', () => {
    render(
      <LimitedTextarea
        id="notes"
        value="Hello"
        maxLength={10}
        showCounter={false}
        onChange={vi.fn()}
      />,
    );

    expect(screen.queryByText('5/10')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-describedby');
  });
});
