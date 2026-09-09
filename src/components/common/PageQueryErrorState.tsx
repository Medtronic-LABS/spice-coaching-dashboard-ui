import { PageTitle } from '@/components/common/PageTitle';
import { PageLoadErrorPanel } from '@/components/common/PageLoadErrorPanel';
import { parseApiError } from '@/utils/parseApiError';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export interface PageQueryErrorStateProps {
  pageTitle: string;
  pageSubtitle?: string;
  error: unknown;
  /** Context-specific heading shown to the user (e.g. "Unable to load configuration"). */
  errorTitle?: string;
  onRetry: () => void;
  dashboardPath?: string;
  showDashboardAction?: boolean;
}

export const PageQueryErrorState = ({
  pageTitle,
  pageSubtitle,
  error,
  errorTitle,
  onRetry,
  dashboardPath,
  showDashboardAction = true,
}: PageQueryErrorStateProps) => {
  const { t } = useTranslation();
  const parsed = useMemo(() => parseApiError(error), [error]);

  const resolvedTitle = errorTitle ?? parsed.title;
  const resolvedDescription = parsed.message
    ? parsed.message
    : t('common.pageLoadErrorSupport');

  return (
    <section className="space-y-6">
      <PageTitle title={pageTitle} subtitle={pageSubtitle} />

      <PageLoadErrorPanel
        title={resolvedTitle}
        description={resolvedDescription}
        onRetry={onRetry}
        dashboardPath={dashboardPath}
        showDashboardAction={showDashboardAction}
      />
    </section>
  );
};
