import { useTranslation } from 'react-i18next';
import { EmptyState, TruncatedText } from '@/components/ui';
import { useFetchPublishedModuleCompletionsQuery } from '@/features/admin-dashboard/api/dashboardApi';
import type { PublishedModuleCompletionItem } from '@/features/admin-dashboard/types/dashboard.types';
import { DashboardTableSkeleton } from '@/features/admin-dashboard/components/DashboardSkeletons';
import { DashboardWidgetErrorState } from '@/features/admin-dashboard/components/DashboardWidgetErrorState';
import { DashboardWidgetShell } from '@/features/admin-dashboard/components/DashboardWidgetShell';
import { resolveModuleCompletionTone } from '@/features/admin-dashboard/utils/moduleCompletionTones';
import { buildPublishedModuleCompletionsQueryArgs } from '@/features/admin-dashboard/utils/publishedModuleCompletions';
import { resolveDashboardQueryUiState } from '@/features/admin-dashboard/utils/queryUiState';
import { resolveDisplayText } from '@/config/deploymentLocale';
import { cn } from '@/utils';

interface TrainingModulesSectionProps {
  fromDate: string;
  toDate: string;
}

function formatLaunchedDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export const TrainingModulesSection = ({
  fromDate,
  toDate,
}: TrainingModulesSectionProps) => {
  const { t } = useTranslation();
  const query = useFetchPublishedModuleCompletionsQuery(
    buildPublishedModuleCompletionsQueryArgs(fromDate, toDate),
  );
  const { data, error, refetch, isFetching } = query;
  const { showLoading, showError } = resolveDashboardQueryUiState(query);

  const isForbidden =
    showError &&
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    error.status === 403;

  if (isForbidden) return null;

  const modules = data?.modules ?? [];

  return (
    <DashboardWidgetShell
      title={t('adminDashboard.trainingModules.title')}
      description={t('adminDashboard.trainingModules.description')}
      flush
      size="lg"
      onRefresh={() => void refetch()}
      isRefreshing={isFetching}
    >
      {showLoading ? (
        <DashboardTableSkeleton rows={5} columns={3} />
      ) : showError ? (
        <div className="px-4 pb-4">
          <DashboardWidgetErrorState onRetry={() => void refetch()} />
        </div>
      ) : modules.length === 0 ? (
        <div className="px-4 pb-4">
          <EmptyState
            title={t('adminDashboard.trainingModules.emptyTitle')}
            description={t('adminDashboard.trainingModules.emptyDescription')}
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-left text-sm">
            <thead className="bg-spice-brand-primary/10 text-[11px] font-semibold uppercase tracking-wide text-spice-brand-primary">
              <tr>
                <th className="min-w-0 px-4 py-2.5">
                  {t('adminDashboard.trainingModules.columns.name')}
                </th>
                <th className="w-28 whitespace-nowrap px-4 py-2.5">
                  {t('adminDashboard.trainingModules.columns.launched')}
                </th>
                <th className="w-32 whitespace-nowrap px-4 py-2.5">
                  {t('adminDashboard.trainingModules.columns.completed')}
                </th>
              </tr>
            </thead>
            <tbody>
              {modules.map((row: PublishedModuleCompletionItem, index) => {
                const title = resolveDisplayText(row.title);
                return (
                  <tr
                    key={row.module_id}
                    className="border-t border-spice-border"
                  >
                    <td className="min-w-0 px-4 py-2.5">
                      <TruncatedText
                        text={title}
                        className="font-medium text-spice-text-primary"
                      />
                    </td>
                    <td className="w-28 whitespace-nowrap px-4 py-2.5 text-spice-text-muted">
                      {formatLaunchedDate(row.published_at)}
                    </td>
                    <td
                      className={cn(
                        'w-32 whitespace-nowrap px-4 py-2.5 font-semibold',
                        resolveModuleCompletionTone(index).textClassName,
                      )}
                    >
                      {`${row.completed_sk_count}/${row.total_descendant_sk_count}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardWidgetShell>
  );
};
