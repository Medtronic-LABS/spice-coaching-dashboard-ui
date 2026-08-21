import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ProgressBar } from '@/components/common/ProgressBar';
import {
  EmptyState,
  InfiniteScrollContainer,
  TruncatedText,
} from '@/components/ui';
import { useFetchPublishedModuleCompletionsQuery } from '@/features/admin-dashboard/api/dashboardApi';
import type { PublishedModuleCompletionItem } from '@/features/admin-dashboard/types/dashboard.types';
import { DashboardTableSkeleton } from '@/features/admin-dashboard/components/DashboardSkeletons';
import { DashboardWidgetErrorState } from '@/features/admin-dashboard/components/DashboardWidgetErrorState';
import { DashboardWidgetShell } from '@/features/admin-dashboard/components/DashboardWidgetShell';
import { resolveModuleCompletionTone } from '@/features/admin-dashboard/utils/moduleCompletionTones';
import type { DashboardGeographyFilters } from '@/features/admin-dashboard/types/dashboard.types';
import { buildPublishedModuleCompletionsQueryArgs } from '@/features/admin-dashboard/utils/dashboardQueryArgs';
import { resolveDashboardQueryUiState } from '@/features/admin-dashboard/utils/queryUiState';
import { resolveDisplayText } from '@/config/deploymentLocale';
import { cn } from '@/utils';

interface TrainingModulesSectionProps {
  fromDate: string;
  toDate: string;
  geography: DashboardGeographyFilters;
}

const TRAINING_MODULES_PAGE_LIMIT = 20;

function formatLaunchedDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export const TrainingModulesSection = ({
  fromDate,
  toDate,
  geography,
}: TrainingModulesSectionProps) => {
  const { t } = useTranslation();
  const [offset, setOffset] = useState(0);
  const [accumulatedModules, setAccumulatedModules] = useState<
    PublishedModuleCompletionItem[]
  >([]);

  useEffect(() => {
    setOffset(0);
  }, [
    fromDate,
    toDate,
    geography.divisionId,
    geography.districtId,
    geography.upazilaId,
  ]);

  const query = useFetchPublishedModuleCompletionsQuery(
    buildPublishedModuleCompletionsQueryArgs(fromDate, toDate, geography, {
      limit: TRAINING_MODULES_PAGE_LIMIT,
      offset,
    }),
  );
  const { error, refetch, isFetching } = query;
  const modulesData = query.currentData?.modules ?? query.data?.modules;
  const { showLoading, showError } = resolveDashboardQueryUiState(query);
  const totalModules =
    query.currentData?.total_modules ?? query.data?.total_modules ?? 0;

  useEffect(() => {
    if (!modulesData) return;
    setAccumulatedModules((prev) => {
      if (offset === 0) {
        // Prefer module object identity over module_id so date/filter refetches
        // with the same roster still replace stale completion counts.
        if (
          prev.length === modulesData.length &&
          prev.every((item, idx) => item === modulesData[idx])
        ) {
          return prev;
        }
        return modulesData;
      }
      const existingIds = new Set(prev.map((item) => item.module_id));
      const newItems = modulesData.filter(
        (item) => !existingIds.has(item.module_id),
      );
      if (newItems.length === 0) return prev;
      return [...prev, ...newItems];
    });
  }, [modulesData, offset]);

  const isForbidden =
    showError &&
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    error.status === 403;

  const modules = accumulatedModules;
  const hasMore =
    ((query.currentData ?? query.data)?.offset ?? offset) +
      TRAINING_MODULES_PAGE_LIMIT <
    totalModules;
  const isLoadingMore = offset > 0 && isFetching;

  const handleLoadMore = useCallback(() => {
    if (!hasMore || isFetching) return;
    setOffset((prev) => prev + TRAINING_MODULES_PAGE_LIMIT);
  }, [hasMore, isFetching]);

  const handleRefresh = useCallback(() => {
    if (offset !== 0) {
      setOffset(0);
      return;
    }
    void refetch();
  }, [offset, refetch]);

  if (isForbidden) return null;

  return (
    <DashboardWidgetShell
      title={t('adminDashboard.trainingModules.title')}
      description={t('adminDashboard.trainingModules.description')}
      flush
      size="lg"
      onRefresh={handleRefresh}
      isRefreshing={isFetching && offset === 0 && modules.length > 0}
    >
      {showLoading && offset === 0 ? (
        <DashboardTableSkeleton rows={5} columns={4} />
      ) : showError && offset === 0 ? (
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
        <InfiniteScrollContainer
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          loadedCount={modules.length}
          isLoadingMore={isLoadingMore}
          error={showError}
          onRetry={() => void refetch()}
        >
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="bg-spice-palette-violetLt text-xs font-bold uppercase leading-[15px] text-spice-palette-violetDeep">
                <tr>
                  <th className="min-w-0 px-4 py-2.5">
                    {t('adminDashboard.trainingModules.columns.name')}
                  </th>
                  <th className="w-28 whitespace-nowrap px-4 py-2.5">
                    {t('adminDashboard.trainingModules.columns.launched')}
                  </th>
                  <th className="min-w-[8rem] px-4 py-2.5">
                    {t('adminDashboard.trainingModules.columns.progress')}
                  </th>
                  <th className="w-32 whitespace-nowrap px-4 py-2.5">
                    {t('adminDashboard.trainingModules.columns.completed')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {modules.map((row: PublishedModuleCompletionItem) => {
                  const title = resolveDisplayText(row.title);
                  const total =
                    row.assigned_sk_count ?? row.total_descendant_sk_count;
                  const completed = row.completed_sk_count;
                  const percent = total > 0 ? (completed / total) * 100 : 0;
                  const tone = resolveModuleCompletionTone(percent);

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
                      <td className="min-w-[8rem] px-4 py-2.5">
                        <ProgressBar
                          value={percent}
                          className="h-2 w-full min-w-[6rem]"
                          barClassName={tone.barClassName}
                        />
                      </td>
                      <td
                        className={cn(
                          'w-32 whitespace-nowrap px-4 py-2.5 font-semibold tabular-nums',
                          tone.textClassName,
                        )}
                      >
                        {completed}
                        <span className="text-spice-text-muted">/{total}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </InfiniteScrollContainer>
      )}
    </DashboardWidgetShell>
  );
};
