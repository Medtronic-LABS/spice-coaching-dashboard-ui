import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ProgressBar } from '@/components/common/ProgressBar';
import { EmptyState } from '@/components/ui';
import { useFetchPublishedModuleCompletionsQuery } from '@/features/admin-dashboard/api/dashboardApi';
import { DashboardListSkeleton } from '@/features/admin-dashboard/components/DashboardSkeletons';
import { DashboardWidgetErrorState } from '@/features/admin-dashboard/components/DashboardWidgetErrorState';
import { DashboardWidgetShell } from '@/features/admin-dashboard/components/DashboardWidgetShell';
import { resolveDashboardQueryUiState } from '@/features/admin-dashboard/utils/queryUiState';
import { resolveDisplayText } from '@/config/deploymentLocale';
import { cn } from '@/utils';

interface ModulePerformanceSectionProps {
  fromDate: string;
  toDate: string;
}

const ROW_TONES = [
  {
    barClassName: 'bg-spice-brand-primary',
    textClassName: 'text-spice-brand-primary',
  },
  {
    barClassName: 'bg-spice-semantic-info',
    textClassName: 'text-spice-semantic-info',
  },
  {
    barClassName: 'bg-spice-semantic-success',
    textClassName: 'text-spice-semantic-success',
  },
  {
    barClassName: 'bg-spice-semantic-warning',
    textClassName: 'text-spice-semantic-warning',
  },
] as const;

export const ModulePerformanceSection = ({
  fromDate,
  toDate,
}: ModulePerformanceSectionProps) => {
  const { t } = useTranslation();
  const query = useFetchPublishedModuleCompletionsQuery({
    from_date: fromDate,
    to_date: toDate,
    limit: 20,
    offset: 0,
  });
  const { data, refetch, isFetching } = query;
  const { showLoading, showError } = resolveDashboardQueryUiState(query);

  const rows = useMemo(() => {
    return (data?.modules ?? []).map((module, index) => {
      const total = module.total_descendant_sk_count;
      const completed = module.completed_sk_count;
      const tone = ROW_TONES[index % ROW_TONES.length];
      return {
        id: module.module_id,
        title: resolveDisplayText(module.title),
        completed,
        total,
        percent: total > 0 ? (completed / total) * 100 : 0,
        barClassName: tone.barClassName,
        textClassName: tone.textClassName,
      };
    });
  }, [data?.modules]);

  return (
    <DashboardWidgetShell
      title={t('adminDashboard.modulePerformance.title')}
      description={t('adminDashboard.modulePerformance.description')}
      onRefresh={() => void refetch()}
      isRefreshing={isFetching}
    >
      {showLoading ? (
        <DashboardListSkeleton rows={6} />
      ) : showError ? (
        <DashboardWidgetErrorState onRetry={() => void refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          title={t('charts.emptyTitle')}
          description={t('charts.emptyDescription')}
        />
      ) : (
        <ul className="pr-1">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex items-center gap-3 border-b border-spice-border py-2 last:border-b-0"
            >
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-spice-text-primary">
                {row.title}
              </span>
              <ProgressBar
                value={row.percent}
                className="h-[5px] w-[100px] shrink-0"
                barClassName={cn(row.barClassName)}
              />
              <span
                className={cn(
                  'w-16 shrink-0 text-right text-[13px] font-bold tabular-nums',
                  row.textClassName,
                )}
              >
                {row.completed}
                <span className="text-[11px] font-semibold text-spice-text-muted">
                  /{row.total}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </DashboardWidgetShell>
  );
};
