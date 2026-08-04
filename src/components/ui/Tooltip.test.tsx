import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Tooltip } from '@/components/ui/Tooltip';

function mockElementRect(
  element: Element,
  rect: Pick<DOMRect, 'top' | 'left' | 'bottom' | 'right' | 'width' | 'height'>,
) {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    x: rect.left,
    y: rect.top,
    toJSON: () => ({}),
    ...rect,
  } as DOMRect);
}

function mockTooltipSize(
  element: HTMLElement,
  size: { width: number; height: number },
) {
  Object.defineProperty(element, 'offsetWidth', {
    configurable: true,
    get: () => size.width,
  });
  Object.defineProperty(element, 'offsetHeight', {
    configurable: true,
    get: () => size.height,
  });
}

describe('Tooltip', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('shows tooltip content when the trigger is hovered', async () => {
    const user = userEvent.setup();

    render(<Tooltip label="About status" content="Backend-driven status" />);

    const trigger = screen.getByRole('button', { name: 'About status' });
    expect(trigger).toBeVisible();
    expect(screen.queryByText('Backend-driven status')).not.toBeInTheDocument();

    await user.hover(trigger);
    expect(screen.getByText('Backend-driven status')).toBeInTheDocument();
  });

  it('keeps the tooltip open when the cursor moves onto the content', () => {
    vi.useFakeTimers();

    render(<Tooltip label="About status" content="Backend-driven status" />);

    const trigger = screen.getByRole('button', { name: 'About status' });
    fireEvent.mouseEnter(trigger);

    const tooltip = screen.getByRole('tooltip');
    fireEvent.mouseLeave(trigger);
    fireEvent.mouseEnter(tooltip);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByText('Backend-driven status')).toBeInTheDocument();
  });

  it('hides the tooltip after the close delay when leaving trigger and content', () => {
    vi.useFakeTimers();

    render(<Tooltip label="About status" content="Backend-driven status" />);

    const trigger = screen.getByRole('button', { name: 'About status' });
    fireEvent.mouseEnter(trigger);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.mouseLeave(trigger);

    act(() => {
      vi.advanceTimersByTime(149);
    });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('allows interaction with rich tooltip content', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();

    render(
      <Tooltip
        label="About merge"
        content={
          <button type="button" onClick={onAction}>
            Learn more
          </button>
        }
      />,
    );

    await user.hover(screen.getByRole('button', { name: 'About merge' }));
    await user.click(screen.getByRole('button', { name: 'Learn more' }));

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('toggles visibility when the trigger is clicked', () => {
    render(<Tooltip label="About status" content="Backend-driven status" />);

    const trigger = screen.getByRole('button', { name: 'About status' });
    // fireEvent avoids userEvent's hover-before-click, which would open then immediately close
    fireEvent.click(trigger);
    expect(screen.getByText('Backend-driven status')).toBeInTheDocument();

    fireEvent.click(trigger);
    expect(screen.queryByText('Backend-driven status')).not.toBeInTheDocument();
  });

  it('positions below the trigger by default when there is enough space', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('innerWidth', 1000);
    vi.stubGlobal('innerHeight', 800);

    render(<Tooltip label="About status" content="Backend-driven status" />);

    const trigger = screen.getByRole('button', { name: 'About status' });
    mockElementRect(trigger, {
      top: 100,
      left: 120,
      bottom: 114,
      right: 134,
      width: 14,
      height: 14,
    });

    await user.hover(trigger);

    const tooltip = screen.getByRole('tooltip');
    mockTooltipSize(tooltip, { width: 200, height: 80 });
    fireEvent.scroll(window);

    expect(tooltip.style.top).toBe('122px');
    expect(tooltip.style.left).toBe('120px');
  });

  it('flips to the top when the preferred bottom side does not fit', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('innerWidth', 1000);
    vi.stubGlobal('innerHeight', 400);

    render(
      <Tooltip
        label="About status"
        content="Backend-driven status"
        placement="bottom"
      />,
    );

    const trigger = screen.getByRole('button', { name: 'About status' });
    mockElementRect(trigger, {
      top: 350,
      left: 120,
      bottom: 364,
      right: 134,
      width: 14,
      height: 14,
    });

    await user.hover(trigger);

    const tooltip = screen.getByRole('tooltip');
    mockTooltipSize(tooltip, { width: 200, height: 120 });
    fireEvent.scroll(window);

    // top = trigger.top - gap - height = 350 - 8 - 120 = 222
    expect(tooltip.style.top).toBe('222px');
    expect(tooltip.style.left).toBe('120px');
  });

  it('honors an explicit left placement when space allows', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('innerWidth', 1000);
    vi.stubGlobal('innerHeight', 800);

    render(
      <Tooltip
        label="About status"
        content="Backend-driven status"
        placement="left"
      />,
    );

    const trigger = screen.getByRole('button', { name: 'About status' });
    mockElementRect(trigger, {
      top: 200,
      left: 400,
      bottom: 214,
      right: 414,
      width: 14,
      height: 14,
    });

    await user.hover(trigger);

    const tooltip = screen.getByRole('tooltip');
    mockTooltipSize(tooltip, { width: 200, height: 80 });
    fireEvent.scroll(window);

    // left = trigger.left - gap - width = 400 - 8 - 200 = 192
    expect(tooltip.style.left).toBe('192px');
    expect(tooltip.style.top).toBe('200px');
  });
});
