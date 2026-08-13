import { useTranslation } from 'react-i18next';
import { RefreshIcon } from '@/assets/icon';
import { Button } from '@/components/ui';
import { cn } from '@/utils';

interface DashboardWidgetRefreshButtonProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
  className?: string;
}

/**
 * Shared per-widget refresh control for admin-dashboard shells.
 * Matches Document & knowledge usage: icon button, spin + disable while fetching.
 */
export const DashboardWidgetRefreshButton = ({
  onRefresh,
  isRefreshing = false,
  className,
}: DashboardWidgetRefreshButtonProps) => {
  const { t } = useTranslation();
  const label = t('common.refresh');

  return (
    <Button
      variant="secondary"
      className={cn('h-9 w-9 shrink-0 px-0', className)}
      onClick={onRefresh}
      aria-label={label}
      title={label}
      disabled={isRefreshing}
    >
      <RefreshIcon className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
    </Button>
  );
};
