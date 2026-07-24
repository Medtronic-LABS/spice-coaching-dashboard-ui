import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TruncatedText } from '@/components/ui/TruncatedText';

function setElementWidth(
  element: HTMLElement,
  clientWidth: number,
  scrollWidth: number,
) {
  Object.defineProperties(element, {
    clientWidth: { configurable: true, value: clientWidth },
    scrollWidth: { configurable: true, value: scrollWidth },
  });
}

describe('TruncatedText', () => {
  it('reveals truncated text on hover and keyboard focus', () => {
    const text = 'A complete module title that is wider than its table cell';
    render(<TruncatedText text={text} focusable />);

    const content = screen.getByText(text);
    const trigger = content.parentElement;
    expect(trigger).not.toBeNull();
    setElementWidth(content, 120, 360);

    fireEvent.mouseEnter(trigger!);
    expect(screen.getByRole('tooltip')).toHaveTextContent(text);

    fireEvent.mouseLeave(trigger!);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    fireEvent.focus(trigger!);
    expect(screen.getByRole('tooltip')).toHaveTextContent(text);
    expect(trigger).toHaveAttribute(
      'aria-describedby',
      screen.getByRole('tooltip').id,
    );

    fireEvent.blur(trigger!);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('does not show a tooltip when the text fits', () => {
    render(<TruncatedText text="Short title" focusable />);

    const content = screen.getByText('Short title');
    const trigger = content.parentElement;
    expect(trigger).not.toBeNull();
    setElementWidth(content, 120, 120);

    fireEvent.mouseEnter(trigger!);
    fireEvent.focus(trigger!);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('reveals truncated text when an interactive child receives focus', () => {
    const text = 'Published module title with complete detail';
    render(
      <TruncatedText text={text}>
        <a href="/module-details">{text}</a>
      </TruncatedText>,
    );

    const link = screen.getByRole('link', { name: text });
    const content = link.parentElement;
    expect(content).not.toBeNull();
    setElementWidth(content!, 100, 280);

    fireEvent.focus(link);

    expect(screen.getByRole('tooltip')).toHaveTextContent(text);
  });
});
