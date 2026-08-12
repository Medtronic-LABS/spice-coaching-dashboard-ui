import { useTranslation } from 'react-i18next';
import { RefreshIcon } from '@/assets/icon';
import { Button } from '@/components/ui';

interface DashboardWidgetErrorStateProps {
  onRetry: () => void;
  title?: string;
  description?: string;
  compact?: boolean;
}

export const DashboardWidgetErrorState = ({
  onRetry,
  title,
  description,
  compact = false,
}: DashboardWidgetErrorStateProps) => {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t('adminDashboard.widgetError.title');
  const resolvedDescription =
    description ??
    (compact
      ? t('adminDashboard.widgetError.compactDescription')
      : t('adminDashboard.widgetError.description'));

  if (compact) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-spice-border-mid bg-spice-bg-tint/50 px-4 py-3">
        <div className="min-w-0 text-left">
          <p className="text-sm font-medium text-spice-text-primary">
            {resolvedTitle}
          </p>
          <p className="mt-0.5 text-xs text-spice-text-muted">
            {resolvedDescription}
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="h-8 shrink-0 gap-1.5 px-3 text-xs"
          onClick={onRetry}
        >
          <RefreshIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {t('adminDashboard.widgetError.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-spice-border-mid bg-spice-bg-tint/40 px-4 py-5 text-center">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full bg-spice-bg-surface ring-1 ring-spice-border"
        aria-hidden="true"
      >
        <RefreshIcon className="h-4 w-4 text-spice-text-muted" />
      </div>
      <h4 className="mt-2.5 text-sm font-semibold text-spice-text-primary">
        {resolvedTitle}
      </h4>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-spice-text-muted">
        {resolvedDescription}
      </p>
      <Button
        type="button"
        variant="secondary"
        className="mt-3 h-8 px-3 text-xs"
        onClick={onRetry}
      >
        {t('adminDashboard.widgetError.retry')}
      </Button>
    </div>
  );
};
