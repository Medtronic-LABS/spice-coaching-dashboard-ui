import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LimitedTextInput } from '@/components/ui/LimitedTextInput';

describe('LimitedTextInput', () => {
  it('shows a character counter and blocks input beyond maxLength', () => {
    const onChange = vi.fn();
    render(
      <LimitedTextInput
        id="title"
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

  it('places the character counter on the same row when counterPlacement is inline', () => {
    render(
      <LimitedTextInput
        id="option"
        value="Hello"
        maxLength={150}
        counterPlacement="inline"
        onChange={vi.fn()}
      />,
    );

    const counter = screen.getByText('5/150');
    expect(counter.parentElement).toHaveClass('flex', 'items-center');
  });
});
