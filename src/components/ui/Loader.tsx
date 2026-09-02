import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { OVERLAY_Z_INDEX } from '@/components/ui/overlayZIndex';

export interface LoaderProps {
  /** When false, renders nothing. Defaults to true. */
  open?: boolean;
  label?: string;
}

export interface CircularSpinnerProps {
  className?: string;
}

export function CircularSpinner({
  className = 'h-14 w-14',
}: CircularSpinnerProps) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 56 56"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="28"
        cy="28"
        r="22"
        strokeWidth="5"
        className="stroke-current opacity-20"
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
      className={`fixed inset-0 ${OVERLAY_Z_INDEX.loader} flex flex-col items-center justify-center gap-4 bg-black/40`}
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
