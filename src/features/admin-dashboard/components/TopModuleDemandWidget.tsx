import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronIcon } from '@/assets/icon';
import { Button, EmptyState, TruncatedText } from '@/components/ui';
import { DashboardListSkeleton } from '@/features/admin-dashboard/components/DashboardSkeletons';
import { DashboardWidgetErrorState } from '@/features/admin-dashboard/components/DashboardWidgetErrorState';
import { DashboardWidgetShell } from '@/features/admin-dashboard/components/DashboardWidgetShell';
import { cn } from '@/utils';

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
  titleColumnLabel: string;
  rows: TopModuleDemandRow[];
  showLoading: boolean;
  showError: boolean;
  error?: unknown;
  onRetry: () => void;
  showActions: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  hasMore?: boolean;
  onSeeMore?: () => void;
  isLoadingMore?: boolean;
  /** Optional header controls (e.g. PO/SK view toggle). */
  headerActions?: ReactNode;
  renderExpandedContent: (rowId: string) => ReactNode;
}

export const TopModuleDemandWidget = ({
  title,
  description,
  titleColumnLabel,
  rows,
  showLoading,
  showError,
  error,
  onRetry,
  showActions,
  emptyTitle,
  emptyDescription,
  hasMore = false,
  onSeeMore,
  isLoadingMore = false,
  headerActions,
  renderExpandedContent,
}: TopModuleDemandWidgetProps) => {
  const { t } = useTranslation();
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const gridClass = showActions
    ? 'grid-cols-[minmax(0,1fr)_6rem_5.25rem]'
    : 'grid-cols-[minmax(0,1fr)_6rem]';

  return (
    <DashboardWidgetShell
      title={title}
      description={description}
      size="lg"
      actions={headerActions}
    >
      {showLoading ? (
        <DashboardListSkeleton rows={5} />
      ) : showError ? (
        <DashboardWidgetErrorState error={error} onRetry={onRetry} />
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
              'text-[11px] font-bold uppercase tracking-wide text-spice-palette-purple',
              gridClass,
            )}
          >
            <span className="text-left">{titleColumnLabel}</span>
            <span className="text-left">
              {t('adminDashboard.moduleDemand.columns.searchCount')}
            </span>
            {showActions ? (
              <span className="text-left">
                {t('adminDashboard.moduleDemand.columns.action')}
              </span>
            ) : null}
          </div>

          <ol className="min-h-0 flex-1 divide-y divide-spice-border/60 overflow-y-auto overflow-x-hidden pr-1">
            {rows.map((row) => {
              const isExpanded = expandedRowId === row.id;

              return (
                <li key={row.id} className="py-3">
                  <div className={cn('grid items-center gap-2', gridClass)}>
                    <button
                      type="button"
                      className="flex w-full min-w-0 items-center gap-1.5 overflow-hidden text-left text-sm font-medium text-spice-text-primary hover:text-spice-brand-primary"
                      aria-expanded={isExpanded}
                      onClick={() =>
                        setExpandedRowId((current) =>
                          current === row.id ? null : row.id,
                        )
                      }
                    >
                      <ChevronIcon
                        expanded={isExpanded}
                        className="h-3.5 w-3.5 shrink-0 text-spice-text-muted"
                      />
                      <span className="min-w-0 flex-1">
                        <TruncatedText
                          text={row.title}
                          maxChars={80}
                          className="font-medium"
                        />
                      </span>
                    </button>
                    <span className="text-center text-sm font-semibold tabular-nums text-spice-palette-purple">
                      {row.searchCount}
                    </span>
                    {showActions ? (
                      <div className="flex w-full justify-stretch">
                        {row.actionLabel && row.onAction ? (
                          <Button
                            variant="secondary"
                            className="h-7 w-full px-0.5 py-0 text-[10px] leading-none"
                            onClick={(event) => {
                              event.stopPropagation();
                              row.onAction?.();
                            }}
                          >
                            {row.actionLabel}
                          </Button>
                        ) : (
                          <span className="h-7 w-full" aria-hidden />
                        )}
                      </div>
                    ) : null}
                  </div>
                  {isExpanded ? (
                    <div className="mt-3 rounded-lg border border-spice-border/70 bg-spice-bg-tint/40 p-3">
                      {renderExpandedContent(row.id)}
                    </div>
                  ) : null}
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
