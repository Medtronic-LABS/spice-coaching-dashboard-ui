import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  DEFAULT_FEEDBACK_DISMISS_MS,
  useAutoDismissFeedback,
} from './useAutoDismissFeedback';

describe('useAutoDismissFeedback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls onDismiss after the default delay when feedback is set', () => {
    const onDismiss = vi.fn();

    renderHook(({ feedback }) => useAutoDismissFeedback(feedback, onDismiss), {
      initialProps: { feedback: { message: 'Saved.' } as const },
    });

    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(DEFAULT_FEEDBACK_DISMISS_MS);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not call onDismiss when feedback is cleared before the delay', () => {
    const onDismiss = vi.fn();

    const { rerender } = renderHook(
      ({ feedback }) => useAutoDismissFeedback(feedback, onDismiss),
      {
        initialProps: {
          feedback: { message: 'Saved.' } as { message: string } | null,
        },
      },
    );

    act(() => {
      vi.advanceTimersByTime(DEFAULT_FEEDBACK_DISMISS_MS - 1);
    });

    rerender({ feedback: null });

    act(() => {
      vi.advanceTimersByTime(DEFAULT_FEEDBACK_DISMISS_MS);
    });

    expect(onDismiss).not.toHaveBeenCalled();
  });
});
