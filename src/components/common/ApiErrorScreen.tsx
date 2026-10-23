import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AppErrorScreen,
  type AppErrorScreenProps,
  type AppErrorScreenVariant,
} from '@/components/common/AppErrorScreen';
import {
  GENERIC_API_ERROR_DESCRIPTION,
  parseApiError,
} from '@/utils/parseApiError';

export interface ApiErrorScreenProps {
  error: unknown;
  variant?: AppErrorScreenVariant;
  title?: string;
  description?: string;
  onRetry?: () => void;
  onRefresh?: () => void;
  onGoHome?: () => void;
  showGoHome?: boolean;
  footerHelp?: string | null;
  primaryAction?: AppErrorScreenProps['primaryAction'];
  secondaryAction?: AppErrorScreenProps['secondaryAction'];
}

export const ApiErrorScreen = ({
  error,
  variant = 'section',
  title,
  description,
  onRetry,
  onRefresh,
  onGoHome,
  showGoHome,
  footerHelp,
  primaryAction,
  secondaryAction,
}: ApiErrorScreenProps) => {
  const { t } = useTranslation();
  const parsed = useMemo(() => parseApiError(error), [error]);
  const resolvedDescription =
    description ??
    (parsed.description === GENERIC_API_ERROR_DESCRIPTION
      ? t('common.genericApiErrorDescription')
      : parsed.description);
  const devDetails =
    parsed.message && parsed.message !== resolvedDescription
      ? parsed.message
      : null;

  return (
    <AppErrorScreen
      variant={variant}
      title={title ?? parsed.title}
      description={resolvedDescription}
      statusCode={parsed.status}
      errorCode={parsed.code}
      retryable={parsed.retryable}
      onRetry={onRetry}
      onRefresh={onRefresh}
      onGoHome={onGoHome}
      showGoHome={showGoHome}
      devDetails={devDetails}
      footerHelp={footerHelp}
      primaryAction={primaryAction}
      secondaryAction={secondaryAction}
    />
  );
};
