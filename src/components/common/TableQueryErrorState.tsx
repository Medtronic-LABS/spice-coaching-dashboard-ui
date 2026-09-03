import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshIcon } from '@/assets/icon';
import { PageLoadErrorIllustration } from '@/components/common/PageLoadErrorIllustration';
import { Button } from '@/components/ui';
import { ModalTitle } from '@/components/ui/Typography';
import { typographyClasses } from '@/components/ui/typographyClasses';
import { cn } from '@/utils';
import { parseApiError } from '@/utils/parseApiError';

export interface TableQueryErrorStateProps {
  error: unknown;
  /** Context-specific heading (e.g. "Failed to load modules"). */
  errorTitle?: string;
  onRetry?: () => void;
  className?: string;
}

function formatErrorMeta(
  status: number | string,
  code: string | null,
): string | null {
  const parts: string[] = [];
  if (status !== '') {
    parts.push(typeof status === 'number' ? `HTTP ${status}` : String(status));
  }
  if (code) {
    parts.push(code);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

export const TableQueryErrorState = ({
  error,
  errorTitle,
  onRetry,
  className,
}: TableQueryErrorStateProps) => {
  const { t } = useTranslation();
  const parsed = useMemo(() => parseApiError(error), [error]);

  const resolvedTitle = errorTitle ?? parsed.title;
  const resolvedDescription = parsed.message
    ? parsed.message
    : t('common.tableQueryErrorSupport');

  const meta = formatErrorMeta(parsed.status, parsed.code);
  const showDevMeta = Boolean(import.meta.env.DEV) && Boolean(meta);

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 py-14 text-center sm:px-10 sm:py-16',
        className,
      )}
      role="alert"
    >
      <PageLoadErrorIllustration className="h-[100px] w-[140px] shrink-0 sm:h-[120px] sm:w-[160px]" />

      <ModalTitle as="h3" className="mt-6 max-w-md sm:text-xl">
        {resolvedTitle}
      </ModalTitle>
      <p
        className={cn(
          'mt-2 max-w-md leading-relaxed',
          typographyClasses.caption,
        )}
      >
        {resolvedDescription}
      </p>

      {showDevMeta ? (
        <p className="mt-2 text-xs font-medium uppercase tracking-wide text-spice-text-muted">
          {meta}
        </p>
      ) : null}

      {onRetry ? (
        <Button
          type="button"
          className="mt-6 h-10 gap-2 rounded-lg px-5 text-sm"
          onClick={onRetry}
        >
          <RefreshIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
          {t('common.retry')}
        </Button>
      ) : null}
    </div>
  );
};
