import { useTranslation } from 'react-i18next';

/**
 * LoadingState
 * Generic loading placeholder block with optional label.
 *
 * Usage:
 * <LoadingState label="Loading dashboard data..." />
 */
export interface LoadingStateProps {
  label?: string;
}

export const LoadingState = ({ label }: LoadingStateProps) => {
  const { t } = useTranslation();
  const resolvedLabel = label ?? t('common.loading');

  return (
    <div
      className="rounded-lg border border-spice-border bg-spice-bg-surface p-6"
      role="status"
      aria-live="polite"
    >
      <div className="h-2 w-1/3 animate-pulse rounded bg-spice-border" />
      <div className="mt-3 h-2 w-2/3 animate-pulse rounded bg-spice-border" />
      <p className="mt-4 text-sm text-spice-text-muted">{resolvedLabel}</p>
    </div>
  );
};
