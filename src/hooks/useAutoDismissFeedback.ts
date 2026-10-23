import { useEffect } from 'react';

export const DEFAULT_FEEDBACK_DISMISS_MS = 5_000;

/** Clears transient feedback (banners/toasts) after a delay. */
export function useAutoDismissFeedback<T>(
  feedback: T | null | undefined,
  onDismiss: () => void,
  dismissMs: number = DEFAULT_FEEDBACK_DISMISS_MS,
): void {
  useEffect(() => {
    if (!feedback) return undefined;

    const timer = window.setTimeout(onDismiss, dismissMs);
    return () => {
      window.clearTimeout(timer);
    };
  }, [dismissMs, feedback, onDismiss]);
}
