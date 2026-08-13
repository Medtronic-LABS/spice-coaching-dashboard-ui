import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ProgressBar } from '@/components/common/ProgressBar';
import { Button, EmptyState } from '@/components/ui';
import { DashboardListSkeleton } from '@/features/admin-dashboard/components/DashboardSkeletons';
import { DashboardWidgetErrorState } from '@/features/admin-dashboard/components/DashboardWidgetErrorState';
import { DashboardWidgetShell } from '@/features/admin-dashboard/components/DashboardWidgetShell';

export interface TopModuleDemandRow {
  id: string;
  title: string;
  searchCount: number;
  actionLabel?: string;
  onAction?: () => void;
}

interface TopModuleDemandWidgetProps {
  title: string;
  description: string;
  rows: TopModuleDemandRow[];
  showLoading: boolean;
  showError: boolean;
  onRetry: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onRowClick: (rowId: string) => void;
  showActions: boolean;
  footerNote?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

export const TopModuleDemandWidget = ({
  title,
  description,
  rows,
  showLoading,
  showError,
  onRetry,
  onRefresh,
  isRefreshing = false,
  onRowClick,
  showActions,
  footerNote,
  emptyTitle,
  emptyDescription,
}: TopModuleDemandWidgetProps) => {
  const { t } = useTranslation();
  const maxCount = useMemo(
    () => Math.max(...rows.map((row) => row.searchCount), 1),
    [rows],
  );

  return (
    <DashboardWidgetShell
      title={title}
      description={description}
      onRefresh={onRefresh}
      isRefreshing={isRefreshing}
      footer={
        footerNote ? (
          <p className="rounded-md bg-spice-bg-tint px-3 py-2 text-[11px] text-spice-text-muted">
            {footerNote}
          </p>
        ) : undefined
      }
    >
      {showLoading ? (
        <DashboardListSkeleton rows={5} />
      ) : showError ? (
        <DashboardWidgetErrorState onRetry={onRetry} />
      ) : rows.length === 0 ? (
        <EmptyState
          title={emptyTitle ?? t('adminDashboard.moduleDemand.emptyTitle')}
          description={
            emptyDescription ??
            t('adminDashboard.moduleDemand.emptyDescription')
          }
        />
      ) : (
        <ol className="space-y-3">
          {rows.map((row, index) => (
            <li key={row.id} className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-4 shrink-0 font-semibold text-spice-text-muted">
                  {index + 1}
                </span>
                <button
                  type="button"
                  className="min-w-0 flex-1 truncate text-left font-medium text-spice-text-primary hover:text-spice-brand-primary hover:underline"
                  onClick={() => onRowClick(row.id)}
                >
                  {row.title}
                </button>
                <span className="shrink-0 tabular-nums text-spice-text-muted">
                  {row.searchCount}
                </span>
                {showActions && row.actionLabel && row.onAction ? (
                  <Button
                    variant="secondary"
                    className="h-7 px-2 text-[10px]"
                    onClick={row.onAction}
                  >
                    {row.actionLabel}
                  </Button>
                ) : null}
              </div>
              <ProgressBar
                value={(row.searchCount / maxCount) * 100}
                className="h-1.5"
                barClassName="bg-spice-brand-primary"
              />
            </li>
          ))}
        </ol>
      )}
    </DashboardWidgetShell>
  );
};
