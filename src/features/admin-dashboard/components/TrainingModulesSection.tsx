import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/ui';
import { useFetchPublishedModuleCompletionsQuery } from '@/features/admin-dashboard/api/dashboardApi';
import type { PublishedModuleCompletionItem } from '@/features/admin-dashboard/types/dashboard.types';
import { DashboardTableSkeleton } from '@/features/admin-dashboard/components/DashboardSkeletons';
import { DashboardWidgetErrorState } from '@/features/admin-dashboard/components/DashboardWidgetErrorState';
import { DashboardWidgetShell } from '@/features/admin-dashboard/components/DashboardWidgetShell';
import { resolveDashboardQueryUiState } from '@/features/admin-dashboard/utils/queryUiState';
import { resolveDisplayText } from '@/config/deploymentLocale';
import { cn } from '@/utils';

interface TrainingModulesSectionProps {
  fromDate: string;
  toDate: string;
}

const COMPLETION_TONES = [
  'text-spice-brand-primary',
  'text-spice-semantic-info',
  'text-spice-semantic-success',
  'text-spice-semantic-warning',
] as const;

function formatLaunchedDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function completionTone(index: number): string {
  return (
    COMPLETION_TONES[index % COMPLETION_TONES.length] ?? COMPLETION_TONES[0]
  );
}

export const TrainingModulesSection = ({
  fromDate,
  toDate,
}: TrainingModulesSectionProps) => {
  const { t } = useTranslation();
  const query = useFetchPublishedModuleCompletionsQuery({
    from_date: fromDate,
    to_date: toDate,
    limit: 50,
    offset: 0,
  });
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
          <table className="min-w-full text-left text-sm">
            <thead className="bg-spice-brand-primary/10 text-[11px] font-semibold uppercase tracking-wide text-spice-brand-primary">
              <tr>
                <th className="px-4 py-2.5">
                  {t('adminDashboard.trainingModules.columns.name')}
                </th>
                <th className="px-4 py-2.5">
                  {t('adminDashboard.trainingModules.columns.launched')}
                </th>
                <th className="px-4 py-2.5">
                  {t('adminDashboard.trainingModules.columns.completed')}
                </th>
              </tr>
            </thead>
            <tbody>
              {modules.map((row: PublishedModuleCompletionItem, index) => (
                <tr
                  key={row.module_id}
                  className="border-t border-spice-border"
                >
                  <td className="px-4 py-2.5 font-medium text-spice-text-primary">
                    {resolveDisplayText(row.title)}
                  </td>
                  <td className="px-4 py-2.5 text-spice-text-muted">
                    {formatLaunchedDate(row.published_at)}
                  </td>
                  <td
                    className={cn(
                      'px-4 py-2.5 font-semibold',
                      completionTone(index),
                    )}
                  >
                    {`${row.completed_sk_count}/${row.total_descendant_sk_count}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardWidgetShell>
  );
};
