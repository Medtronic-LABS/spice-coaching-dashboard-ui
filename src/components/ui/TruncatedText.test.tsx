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

function mockHiddenSizerWidth(width: number) {
  const originalRect = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect =
    function getBoundingClientRect() {
      if (this.getAttribute('aria-hidden') === 'true') {
        return {
          x: 0,
          y: 0,
          top: 0,
          left: 0,
          right: width,
          bottom: 16,
          width,
          height: 16,
          toJSON: () => ({}),
        };
      }
      return originalRect.call(this);
    };

  return () => {
    HTMLElement.prototype.getBoundingClientRect = originalRect;
  };
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

  it('reveals character-truncated text on hover without measuring overflow', () => {
    const text = `${'A'.repeat(80)} milestone title`;
    render(<TruncatedText text={text} maxChars={20} focusable />);

    const content = screen.getByText(`${'A'.repeat(20)}…`);
    const trigger = content.parentElement;
    expect(trigger).not.toBeNull();

    fireEvent.mouseEnter(trigger!);
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveTextContent(text);
    expect(tooltip.className).toContain('z-[500]');
    expect(tooltip.className).toContain('break-all');
  });

  it('clips continuous child labels instead of overflowing neighboring cells', () => {
    const text = 'A'.repeat(80);
    render(
      <TruncatedText text={text} maxChars={50}>
        {`${'A'.repeat(50)}…`}
      </TruncatedText>,
    );

    const content = screen.getByText(`${'A'.repeat(50)}…`);
    expect(content.className).toContain('truncate');
    expect(content.className).toContain('break-all');
  });

  it('does not show a tooltip when the text fits', () => {
    render(<TruncatedText text="Short title" focusable />);

    const content = screen.getByText('Short title');
    const trigger = content.parentElement;
    expect(trigger).not.toBeNull();
    setElementWidth(content, 120, 120);
    setElementWidth(trigger!, 120, 120);
    const restoreSizer = mockHiddenSizerWidth(80);

    try {
      fireEvent.mouseEnter(trigger!);
      fireEvent.focus(trigger!);

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    } finally {
      restoreSizer();
    }
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

  it('reveals a tooltip when only a nested truncated child overflows', () => {
    const text = 'চিকিৎসা বর্জ্যের প্রকারভেদ ও পরিবেশগত ঝুঁকি';
    render(
      <TruncatedText text={text} maxChars={50}>
        <a href="/module-details" className="block truncate">
          {text}
        </a>
      </TruncatedText>,
    );

    const link = screen.getByRole('link', { name: text });
    const content = link.parentElement;
    const trigger = content?.parentElement;
    expect(content).not.toBeNull();
    expect(trigger).not.toBeNull();
    setElementWidth(content!, 200, 200);
    setElementWidth(link, 200, 420);

    fireEvent.mouseEnter(trigger!);
    expect(screen.getByRole('tooltip')).toHaveTextContent(text);
  });

  it('reveals a tooltip when the full title is visually wider than the cell', () => {
    const text = 'জরায়ু ক্যান্সার: একটি গুরুতর জনস্বাস্থ্য সমস্যা';
    expect(text.length).toBeLessThanOrEqual(50);
    render(<TruncatedText text={text} maxChars={50} focusable />);

    const content = screen.getByText(text);
    const trigger = content.parentElement;
    expect(trigger).not.toBeNull();
    setElementWidth(content, 200, 200);
    setElementWidth(trigger!, 200, 200);
    const restoreSizer = mockHiddenSizerWidth(420);

    try {
      fireEvent.mouseEnter(trigger!);
      expect(screen.getByRole('tooltip')).toHaveTextContent(text);
    } finally {
      restoreSizer();
    }
  });
});
