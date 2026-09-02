import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshIcon } from '@/assets/icon';
import { Button } from '@/components/ui';
import { paths } from '@/constants/routes';
import { cn } from '@/utils';

export type AppErrorScreenVariant = 'page' | 'section' | 'compact';

export interface AppErrorScreenProps {
  variant?: AppErrorScreenVariant;
  title: string;
  description: string;
  statusCode?: number | string;
  errorCode?: string | null;
  retryable?: boolean;
  onRetry?: () => void;
  onRefresh?: () => void;
  onGoHome?: () => void;
  showGoHome?: boolean;
  devDetails?: string | null;
  footerHelp?: string | null;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
}

function formatErrorMeta(
  statusCode?: number | string,
  errorCode?: string | null,
): string | null {
  const parts: string[] = [];
  if (statusCode !== undefined && statusCode !== '') {
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

export const AppErrorScreen = ({
  variant = 'section',
  title,
  description,
  statusCode,
  errorCode,
  retryable = false,
  onRetry,
  onRefresh,
  onGoHome,
  showGoHome = true,
  devDetails,
  footerHelp,
  primaryAction,
  secondaryAction,
}: AppErrorScreenProps) => {
  const { t } = useTranslation();
  const meta = formatErrorMeta(statusCode, errorCode);
  const showDevDetails =
    Boolean(import.meta.env.DEV) && Boolean(devDetails?.trim());

  const handleRefresh = onRefresh ?? (() => window.location.reload());
  const handleGoHome = onGoHome ?? (() => window.location.assign(paths.home));

  const retryAction =
    retryable && onRetry ? (
      <Button type="button" className="h-9 text-xs" onClick={onRetry}>
        <RefreshIcon className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
        {t('common.retry')}
      </Button>
    ) : null;

  const defaultPrimary =
    primaryAction ??
    (retryable && onRetry ? (
      retryAction
    ) : variant === 'compact' && onRetry ? (
      <Button
        type="button"
        variant="secondary"
        className="h-8 shrink-0 gap-1.5 px-3 text-xs"
        onClick={onRetry}
      >
        <RefreshIcon className="h-3.5 w-3.5" aria-hidden="true" />
        {t('common.retry')}
      </Button>
    ) : (
      <Button type="button" className="h-9 text-xs" onClick={handleRefresh}>
        <RefreshIcon className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
        {t('common.retry')}
      </Button>
    ));

  const defaultSecondary =
    secondaryAction ??
    (!showGoHome || variant === 'compact' ? null : (
      <Button
        type="button"
        variant="secondary"
        className="h-9 text-xs"
        onClick={handleGoHome}
      >
        {t('common.goHome')}
      </Button>
    ));

  if (variant === 'compact') {
    const compactAction =
      primaryAction ??
      (onRetry != null ? (
        <Button
          type="button"
          variant="secondary"
          className="h-8 shrink-0 gap-1.5 px-3 text-xs"
          onClick={onRetry}
        >
          <RefreshIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {t('common.retry')}
        </Button>
      ) : (
        defaultPrimary
      ));

    return (
      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-spice-border-mid bg-spice-bg-tint/50 px-4 py-3"
        role="alert"
      >
        <div className="min-w-0 text-left">
          <p className="text-sm font-medium text-spice-text-primary">{title}</p>
          {meta ? (
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-spice-text-muted">
              {meta}
            </p>
          ) : null}
          <p className="mt-0.5 text-xs text-spice-text-muted">{description}</p>
          {showDevDetails ? (
            <p className="mt-2 break-words text-[11px] text-spice-text-medium">
              {devDetails}
            </p>
          ) : null}
        </div>
        {compactAction}
      </div>
    );
  }

  const shellClassName =
    variant === 'page'
      ? 'min-h-screen bg-spice-bg-dashboard px-4 py-10'
      : 'rounded-xl border border-spice-border bg-spice-bg-surface p-6 shadow-spiceCard';

  return (
    <div className={shellClassName} role="alert">
      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-xl border border-spice-border bg-spice-bg-surface p-6 shadow-spiceCard">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-spice-semantic-errorBg text-spice-semantic-error ring-1 ring-spice-semantic-error/25">
              <span aria-hidden="true">!</span>
            </div>
            <div className="min-w-0 flex-1">
              {meta ? (
                <p className="text-[11px] font-semibold uppercase tracking-wide text-spice-text-muted">
                  {meta}
                </p>
              ) : null}
              <h1
                className={cn(
                  'font-semibold text-spice-text-primary',
                  meta ? 'mt-1 text-lg' : 'text-lg',
                )}
              >
                {title}
              </h1>
              <p className="mt-1 text-sm text-spice-text-medium">
                {description}
              </p>
              {showDevDetails ? (
                <div className="mt-3 rounded-lg border border-spice-border bg-spice-bg-tint p-3 text-xs text-spice-text-medium">
                  <div className="font-medium text-spice-text-primary">
                    {t('errorBoundary.detailsDevOnly')}
                  </div>
                  <div className="mt-1 break-words">{devDetails}</div>
                </div>
              ) : null}
              <div className="mt-5 flex flex-wrap gap-3">
                {defaultPrimary}
                {defaultSecondary}
              </div>
            </div>
          </div>
        </div>
        {variant === 'page' && footerHelp ? (
          <p className="mx-auto mt-4 max-w-xl text-center text-xs text-spice-text-muted">
            {footerHelp}
          </p>
        ) : null}
      </div>
    </div>
  );
};
