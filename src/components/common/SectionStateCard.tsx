import { useTranslation } from 'react-i18next';
import { ApiErrorScreen } from '@/components/common/ApiErrorScreen';
import {
  Button,
  Card,
  CircularSpinner,
  ErrorState,
  SectionHeader,
} from '@/components/ui';

export interface SectionStateCardProps {
  title: string;
  subtitle?: string;
  state: 'loading' | 'error';
  loadingLabel?: string;
  errorDescription?: string;
  error?: unknown;
  onRetry?: () => void;
}

export const SectionStateCard = ({
  title,
  subtitle,
  state,
  loadingLabel,
  errorDescription,
  error,
  onRetry,
}: SectionStateCardProps) => {
  const { t } = useTranslation();
  const resolvedErrorDescription =
    errorDescription ?? t('common.pleaseTryAgain');

  return (
    <Card variant="elevated">
      <SectionHeader title={title} subtitle={subtitle} />
      {state === 'loading' ? (
        <div
          className="flex flex-col items-center justify-center gap-3 px-4 py-10"
          role="status"
          aria-live="polite"
          aria-label={
            loadingLabel ?? t('ui.sectionState.loadingWithTitle', { title })
          }
        >
          <CircularSpinner className="h-10 w-10" />
          <p className="text-sm text-spice-text-muted">
            {loadingLabel ?? t('ui.sectionState.loadingWithTitle', { title })}
          </p>
        </div>
      ) : error ? (
        <ApiErrorScreen
          error={error}
          variant="compact"
          onRetry={onRetry}
          showGoHome={false}
        />
      ) : (
        <ErrorState
          title={t('ui.sectionState.unavailableWithTitle', { title })}
          description={resolvedErrorDescription}
          action={
            onRetry ? (
              <Button
                type="button"
                variant="secondary"
                className="h-8 text-xs"
                onClick={onRetry}
              >
                {t('common.retry')}
              </Button>
            ) : undefined
          }
        />
      )}
    </Card>
  );
};
