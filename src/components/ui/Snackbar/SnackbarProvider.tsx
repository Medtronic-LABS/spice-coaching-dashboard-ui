import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { SnackbarViewport } from '@/components/ui/Snackbar/SnackbarViewport';
import type {
  ShowSnackbarOptions,
  SnackbarApi,
  SnackbarItem,
  SnackbarTone,
} from '@/components/ui/Snackbar/snackbar.types';
import { DEFAULT_FEEDBACK_DISMISS_MS } from '@/hooks/useAutoDismissFeedback';
import { formatRtkQueryError } from '@/utils/formatRtkQueryError';

const SnackbarContext = createContext<SnackbarApi | null>(null);

function createSnackbarId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `snackbar-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export interface SnackbarProviderProps {
  children: ReactNode;
}

export const SnackbarProvider = ({ children }: SnackbarProviderProps) => {
  const [items, setItems] = useState<SnackbarItem[]>([]);
  const dismissTimersRef = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timer = dismissTimersRef.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      dismissTimersRef.current.delete(id);
    }
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const show = useCallback(
    ({
      message,
      tone = 'info',
      durationMs = DEFAULT_FEEDBACK_DISMISS_MS,
    }: ShowSnackbarOptions) => {
      const trimmed = message.trim();
      if (!trimmed) return '';

      const id = createSnackbarId();
      setItems((current) => [...current, { id, message: trimmed, tone }]);

      const timer = window.setTimeout(() => {
        dismiss(id);
      }, durationMs);
      dismissTimersRef.current.set(id, timer);

      return id;
    },
    [dismiss],
  );

  const showWithTone = useCallback(
    (tone: SnackbarTone, message: string) => show({ message, tone }),
    [show],
  );

  const value = useMemo<SnackbarApi>(
    () => ({
      show,
      showSuccess: (message) => showWithTone('success', message),
      showError: (message) => showWithTone('critical', message),
      showWarning: (message) => showWithTone('warning', message),
      showInfo: (message) => showWithTone('info', message),
      showApiError: (error) =>
        showWithTone('critical', formatRtkQueryError(error)),
      dismiss,
    }),
    [dismiss, show, showWithTone],
  );

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      {createPortal(
        <SnackbarViewport items={items} onDismiss={dismiss} />,
        document.body,
      )}
    </SnackbarContext.Provider>
  );
};

export function useSnackbar(): SnackbarApi {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within SnackbarProvider');
  }
  return context;
}
