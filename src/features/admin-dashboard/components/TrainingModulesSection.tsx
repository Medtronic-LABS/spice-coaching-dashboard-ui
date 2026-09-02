import { useCallback, useState } from 'react';
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
import { TrainingModulesModuleFilter } from '@/features/admin-dashboard/components/TrainingModulesModuleFilter';
import {
  buildDashboardListFilterKey,
  useAccumulatedFilterPages,
  useFilterKeyedOffset,
} from '@/features/admin-dashboard/hooks/useDashboardListPagination';
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

function trainingModuleItemId(item: PublishedModuleCompletionItem): string {
  return item.module_id;
}

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
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filterKey = buildDashboardListFilterKey(
    fromDate,
    toDate,
    geography,
    sortDir,
    selectedModuleIds.slice().sort().join(','),
  );
  const [offset, setOffset] = useFilterKeyedOffset(filterKey);

  const query = useFetchPublishedModuleCompletionsQuery(
    buildPublishedModuleCompletionsQueryArgs(fromDate, toDate, geography, {
      limit: TRAINING_MODULES_PAGE_LIMIT,
      offset,
      module_id: selectedModuleIds,
      sort_by: 'published_at',
      sort_dir: sortDir,
    }),
  );
  const { error, refetch, isFetching } = query;
  const modulesData = query.currentData?.modules;
  const { showLoading, showError } = resolveDashboardQueryUiState(query);
  const totalModules = query.currentData?.total_modules ?? 0;

  const modules = useAccumulatedFilterPages({
    filterKey,
    queryOffset: offset,
    pageItems: modulesData,
    getItemId: trainingModuleItemId,
  });

  const isForbidden =
    showError &&
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    error.status === 403;

  const hasMore =
    (query.currentData?.offset ?? offset) + TRAINING_MODULES_PAGE_LIMIT <
    totalModules;
  const isLoadingMore = offset > 0 && isFetching;
  const showListLoading =
    offset === 0 && (showLoading || (isFetching && modules.length === 0));

  const handleLoadMore = useCallback(() => {
    if (!hasMore || isFetching) return;
    setOffset((prev) => prev + TRAINING_MODULES_PAGE_LIMIT);
  }, [hasMore, isFetching, setOffset]);

  const toggleLaunchedSort = useCallback(() => {
    setSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc'));
  }, []);

  if (isForbidden) return null;

  const sortIndicator = sortDir === 'asc' ? '↑' : '↓';

  return (
    <DashboardWidgetShell
      title={t('adminDashboard.trainingModules.title')}
      description={t('adminDashboard.trainingModules.description')}
      flush
      size="lg"
      actions={
        <TrainingModulesModuleFilter
          selectedIds={selectedModuleIds}
          onChange={setSelectedModuleIds}
        />
      }
    >
      {showListLoading ? (
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
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 uppercase"
                      onClick={toggleLaunchedSort}
                      aria-label={t(
                        'adminDashboard.trainingModules.columns.launchedSortAria',
                        { direction: sortDir },
                      )}
                    >
                      {t('adminDashboard.trainingModules.columns.launched')}
                      <span aria-hidden className="text-[10px] font-bold">
                        {sortIndicator}
                      </span>
                    </button>
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
