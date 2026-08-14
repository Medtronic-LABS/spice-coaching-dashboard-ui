import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ProgressBar } from '@/components/common/ProgressBar';
import { EmptyState, TruncatedText } from '@/components/ui';
import { useFetchPublishedModuleCompletionsQuery } from '@/features/admin-dashboard/api/dashboardApi';
import { DashboardListSkeleton } from '@/features/admin-dashboard/components/DashboardSkeletons';
import { DashboardWidgetErrorState } from '@/features/admin-dashboard/components/DashboardWidgetErrorState';
import { DashboardWidgetShell } from '@/features/admin-dashboard/components/DashboardWidgetShell';
import { resolveModuleCompletionTone } from '@/features/admin-dashboard/utils/moduleCompletionTones';
import {
  MODULE_PERFORMANCE_DISPLAY_LIMIT,
  buildPublishedModuleCompletionsQueryArgs,
} from '@/features/admin-dashboard/utils/publishedModuleCompletions';
import { resolveDashboardQueryUiState } from '@/features/admin-dashboard/utils/queryUiState';
import { resolveDisplayText } from '@/config/deploymentLocale';
import { cn } from '@/utils';

interface ModulePerformanceSectionProps {
  fromDate: string;
  toDate: string;
}

export const ModulePerformanceSection = ({
  fromDate,
  toDate,
}: ModulePerformanceSectionProps) => {
  const { t } = useTranslation();
  const query = useFetchPublishedModuleCompletionsQuery(
    buildPublishedModuleCompletionsQueryArgs(fromDate, toDate),
  );
  const { data, refetch, isFetching } = query;
  const { showLoading, showError } = resolveDashboardQueryUiState(query);

  const rows = useMemo(() => {
    return (data?.modules ?? [])
      .slice(0, MODULE_PERFORMANCE_DISPLAY_LIMIT)
      .map((module, index) => {
        const total = module.total_descendant_sk_count;
        const completed = module.completed_sk_count;
        const tone = resolveModuleCompletionTone(index);
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
      size="lg"
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
              className="flex items-center gap-3 border-b border-spice-border py-2.5 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <TruncatedText
                  text={row.title}
                  className="text-sm font-medium text-spice-text-primary"
                />
              </div>
              <ProgressBar
                value={row.percent}
                className="h-2 min-w-[6rem] flex-1"
                barClassName={cn(row.barClassName)}
              />
              <span
                className={cn(
                  'w-20 shrink-0 text-right text-sm font-semibold tabular-nums',
                  row.textClassName,
                )}
              >
                {row.completed}
                <span className="text-spice-text-muted">/{row.total}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </DashboardWidgetShell>
  );
};
