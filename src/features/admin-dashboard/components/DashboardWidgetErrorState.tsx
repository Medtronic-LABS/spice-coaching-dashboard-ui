import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshIcon } from '@/assets/icon';
import { ApiErrorScreen } from '@/components/common/ApiErrorScreen';
import { AppErrorScreen } from '@/components/common/AppErrorScreen';
import { Button } from '@/components/ui';
import {
  GENERIC_API_ERROR_DESCRIPTION,
  parseApiError,
} from '@/utils/parseApiError';

interface DashboardWidgetErrorStateProps {
  onRetry: () => void;
  title?: string;
  description?: string;
  compact?: boolean;
  error?: unknown;
}

function formatErrorMeta(
  statusCode: number | string,
  errorCode: string | null,
): string | null {
  const parts: string[] = [];
  if (statusCode !== '') {
    parts.push(
      typeof statusCode === 'number'
        ? `HTTP ${statusCode}`
        : String(statusCode),
    );
  }
  if (errorCode) {
    parts.push(errorCode);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

export const DashboardWidgetErrorState = ({
  onRetry,
  title,
  description,
  compact = false,
  error,
}: DashboardWidgetErrorStateProps) => {
  const { t } = useTranslation();
  const retryLabel = t('adminDashboard.widgetError.retry');
  const parsed = useMemo(() => (error ? parseApiError(error) : null), [error]);

  if (error && compact) {
    return (
      <ApiErrorScreen
        error={error}
        variant="compact"
        title={title}
        description={description}
        onRetry={onRetry}
        primaryAction={
          <Button
            type="button"
            variant="secondary"
            className="h-8 shrink-0 gap-1.5 px-3 text-xs"
            onClick={onRetry}
          >
            <RefreshIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {retryLabel}
          </Button>
        }
      />
    );
  }

  if (error && parsed) {
    const resolvedTitle = title ?? parsed.title;
    const resolvedDescription =
      description ??
      (parsed.description === GENERIC_API_ERROR_DESCRIPTION
        ? t('common.genericApiErrorDescription')
        : parsed.description);
    const meta = formatErrorMeta(parsed.status, parsed.code);

    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-spice-border-mid bg-spice-bg-tint/40 px-4 py-5 text-center">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full bg-spice-bg-surface ring-1 ring-spice-border"
          aria-hidden="true"
        >
          <RefreshIcon className="h-4 w-4 text-spice-text-muted" />
        </div>
        {meta ? (
          <p className="mt-2.5 text-xs font-semibold uppercase tracking-wide text-spice-text-muted">
            {meta}
          </p>
        ) : null}
        <h4 className="mt-1 text-sm font-semibold text-spice-text-primary">
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
          {retryLabel}
        </Button>
      </div>
    );
  }

  const resolvedTitle = title ?? t('adminDashboard.widgetError.title');
  const resolvedDescription =
    description ??
    (compact
      ? t('adminDashboard.widgetError.compactDescription')
      : t('adminDashboard.widgetError.description'));

  if (compact) {
    return (
      <AppErrorScreen
        variant="compact"
        title={resolvedTitle}
        description={resolvedDescription}
        onRetry={onRetry}
        primaryAction={
          <Button
            type="button"
            variant="secondary"
            className="h-8 shrink-0 gap-1.5 px-3 text-xs"
            onClick={onRetry}
          >
            <RefreshIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {retryLabel}
          </Button>
        }
      />
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
        {retryLabel}
      </Button>
    </div>
  );
};
