import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DashboardIcon, RefreshIcon } from '@/assets/icon';
import { PageLoadErrorIllustration } from '@/components/common/PageLoadErrorIllustration';
import { Button } from '@/components/ui';
import { paths } from '@/constants/routes';
import { cn } from '@/utils';

export interface PageLoadErrorPanelProps {
  title: string;
  description: string;
  onRetry: () => void;
  variant?: 'page' | 'section';
  showDashboardAction?: boolean;
  dashboardPath?: string;
  devDetails?: string | null;
  footerHelp?: string | null;
}

export const PageLoadErrorPanel = ({
  title,
  description,
  onRetry,
  variant = 'section',
  showDashboardAction = true,
  dashboardPath = paths.adminDashboard,
  devDetails,
  footerHelp,
}: PageLoadErrorPanelProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const showDevDetails =
    Boolean(import.meta.env.DEV) && Boolean(devDetails?.trim());

  const content = (
    <>
      <PageLoadErrorIllustration className="h-[100px] w-[140px] shrink-0 sm:h-[120px] sm:w-[160px]" />

      <h2 className="mt-6 max-w-lg text-center text-xl font-semibold text-spice-text-primary sm:mt-8 sm:text-2xl">
        {title}
      </h2>
      <p className="mt-3 max-w-md text-center text-sm leading-relaxed text-spice-text-muted">
        {description}
      </p>

      {showDevDetails ? (
        <p className="mt-2 max-w-md text-center text-[11px] leading-relaxed text-spice-text-medium">
          {devDetails}
        </p>
      ) : null}

      <div className="mt-8 w-full max-w-xs space-y-3">
        <Button
          type="button"
          className="h-11 w-full gap-2 rounded-lg text-sm"
          onClick={onRetry}
        >
          <RefreshIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
          {t('common.retry')}
        </Button>

        {showDashboardAction ? (
          <>
            <p className="text-center text-xs text-spice-text-muted">
              {t('common.or')}
            </p>
            <Button
              type="button"
              variant="secondary"
              className="h-11 w-full gap-2 rounded-lg text-sm"
              onClick={() => navigate(dashboardPath)}
            >
              <DashboardIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t('common.goToDashboard')}
            </Button>
          </>
        ) : null}
      </div>
    </>
  );

  if (variant === 'page') {
    return (
      <div
        className="min-h-screen bg-spice-bg-dashboard px-4 py-10"
        role="alert"
      >
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center px-4 py-10">
          {content}
          {footerHelp ? (
            <p className="mx-auto mt-8 max-w-md text-center text-xs text-spice-text-muted">
              {footerHelp}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex min-h-[min(480px,calc(100dvh-14rem))] w-full flex-col items-center justify-center px-4 py-10',
      )}
      role="alert"
    >
      {content}
    </div>
  );
};
