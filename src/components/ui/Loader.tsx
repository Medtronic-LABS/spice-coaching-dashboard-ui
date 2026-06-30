import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

export interface LoaderProps {
  /** When false, renders nothing. Defaults to true. */
  open?: boolean;
  label?: string;
}

function CircularSpinner() {
  return (
    <svg
      className="h-14 w-14 animate-spin"
      viewBox="0 0 56 56"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="28"
        cy="28"
        r="22"
        strokeWidth="5"
        className="stroke-white/20"
      />
      <circle
        cx="28"
        cy="28"
        r="22"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="110"
        strokeDashoffset="75"
        className="stroke-spice-brand-primary"
      />
    </svg>
  );
}

/** Full-screen loading overlay with grey backdrop and spinner. */
export const Loader = ({ open = true, label }: LoaderProps) => {
  const { t } = useTranslation();
  const resolvedLabel = label ?? t('common.loadingPage');

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 bg-black/40"
      role="status"
      aria-live="polite"
      aria-label={resolvedLabel}
    >
      <CircularSpinner />
      <span className="text-sm font-semibold text-white drop-shadow">
        {resolvedLabel}
      </span>
    </div>,
    document.body,
  );
};
