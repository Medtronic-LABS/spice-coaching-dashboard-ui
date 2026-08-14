import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronIcon } from '@/assets/icon';
import { ProgressBar } from '@/components/common/ProgressBar';
import { Button, EmptyState } from '@/components/ui';
import { DashboardListSkeleton } from '@/features/admin-dashboard/components/DashboardSkeletons';
import { DashboardWidgetErrorState } from '@/features/admin-dashboard/components/DashboardWidgetErrorState';
import { DashboardWidgetShell } from '@/features/admin-dashboard/components/DashboardWidgetShell';
import { cn } from '@/utils';

export interface TopModuleDemandRow {
  id: string;
  title: string;
  searchCount: number;
  rank?: number;
  actionLabel?: string;
  onAction?: () => void;
}

interface TopModuleDemandWidgetProps {
  title: string;
  description: string;
  titleColumnLabel: string;
  rows: TopModuleDemandRow[];
  showLoading: boolean;
  showError: boolean;
  onRetry: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onRowClick: (rowId: string) => void;
  showActions: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  hasMore?: boolean;
  onSeeMore?: () => void;
  isLoadingMore?: boolean;
  defaultExpanded?: boolean;
}

export const TopModuleDemandWidget = ({
  title,
  description,
  titleColumnLabel,
  rows,
  showLoading,
  showError,
  onRetry,
  onRefresh,
  isRefreshing = false,
  onRowClick,
  showActions,
  emptyTitle,
  emptyDescription,
  hasMore = false,
  onSeeMore,
  isLoadingMore = false,
  defaultExpanded = true,
}: TopModuleDemandWidgetProps) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const maxCount = useMemo(
    () => Math.max(...rows.map((row) => row.searchCount), 1),
    [rows],
  );

  const collapseSummary =
    rows.length > 0
      ? t('adminDashboard.moduleDemand.collapsedSummary', {
          count: rows.length,
        })
      : undefined;

  return (
    <DashboardWidgetShell
      title={title}
      description={expanded ? description : collapseSummary}
      compact={!expanded}
      onRefresh={onRefresh}
      isRefreshing={isRefreshing}
      actions={
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-spice-text-muted transition-colors hover:bg-spice-bg-tint hover:text-spice-text-primary"
          aria-expanded={expanded}
          aria-label={
            expanded
              ? t('adminDashboard.moduleDemand.collapse')
              : t('adminDashboard.moduleDemand.expand')
          }
          onClick={() => setExpanded((value) => !value)}
        >
          <ChevronIcon expanded={expanded} className="h-4 w-4" />
        </button>
      }
    >
      {!expanded ? null : showLoading ? (
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
        <div className="flex min-h-0 flex-1 flex-col">
          <div
            className={cn(
              'mb-2 grid items-center gap-2 border-b border-spice-border/60 pb-2',
              'text-[10px] font-semibold uppercase tracking-wide text-spice-text-muted',
              showActions
                ? 'grid-cols-[1.5rem_minmax(0,1fr)_minmax(0,1.5fr)_3rem_4.5rem]'
                : 'grid-cols-[1.5rem_minmax(0,1fr)_minmax(0,1.5fr)_3rem]',
            )}
          >
            <span aria-hidden>#</span>
            <span>{titleColumnLabel}</span>
            <span className="hidden sm:block" aria-hidden />
            <span className="text-right">
              {t('adminDashboard.moduleDemand.columns.searchCount')}
            </span>
            {showActions ? (
              <span className="text-right">
                {t('adminDashboard.moduleDemand.columns.action')}
              </span>
            ) : null}
          </div>

          <ol className="min-h-0 max-h-72 flex-1 divide-y divide-spice-border/60 overflow-y-auto pr-1">
            {rows.map((row, index) => {
              const rank = row.rank ?? index + 1;
              const barValue = (row.searchCount / maxCount) * 100;

              return (
                <li key={row.id} className="py-3 first:pt-0">
                  <div
                    className={cn(
                      'grid items-center gap-2',
                      showActions
                        ? 'grid-cols-[1.5rem_minmax(0,1fr)_minmax(0,1.5fr)_3rem_4.5rem]'
                        : 'grid-cols-[1.5rem_minmax(0,1fr)_minmax(0,1.5fr)_3rem]',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full',
                        'bg-spice-brand-primary/10 text-xs font-semibold tabular-nums text-spice-brand-primary',
                      )}
                    >
                      {rank}
                    </span>
                    <button
                      type="button"
                      className="min-w-0 truncate text-left text-sm font-medium text-spice-text-primary hover:text-spice-brand-primary hover:underline"
                      onClick={() => onRowClick(row.id)}
                    >
                      {row.title}
                    </button>
                    <div className="hidden min-w-0 sm:block">
                      <ProgressBar
                        value={barValue}
                        className="h-2"
                        barClassName="bg-spice-brand-primary"
                      />
                    </div>
                    <span className="text-right text-sm font-semibold tabular-nums text-spice-brand-primary">
                      {row.searchCount}
                    </span>
                    {showActions ? (
                      <div className="flex justify-end">
                        {row.actionLabel && row.onAction ? (
                          <Button
                            variant="secondary"
                            className="h-7 px-2 text-[10px]"
                            onClick={(event) => {
                              event.stopPropagation();
                              row.onAction?.();
                            }}
                          >
                            {row.actionLabel}
                          </Button>
                        ) : (
                          <span className="h-7 w-12" aria-hidden />
                        )}
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-2 pl-8 sm:hidden">
                    <ProgressBar
                      value={barValue}
                      className="h-2"
                      barClassName="bg-spice-brand-primary"
                    />
                  </div>
                </li>
              );
            })}
          </ol>

          {hasMore && onSeeMore ? (
            <div className="mt-3 shrink-0 border-t border-spice-border/60 pt-3">
              <Button
                variant="secondary"
                className="h-9 w-full text-xs font-semibold"
                disabled={isLoadingMore}
                onClick={onSeeMore}
              >
                {isLoadingMore
                  ? t('adminDashboard.moduleDemand.loadingMore')
                  : t('adminDashboard.moduleDemand.seeMore')}
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </DashboardWidgetShell>
  );
};
