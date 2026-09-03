import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ProgressBar } from '@/components/common/ProgressBar';
import { Table } from '@/components/common/Table';
import type { ColumnDef } from '@/components/common/Table/Table.types';
import {
  EmptyState,
  InfiniteScrollContainer,
  TruncatedText,
  typographyClasses,
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

  const handleSort = useCallback(
    (_sortKey: string, nextDir: 'asc' | 'desc') => {
      setSortDir(nextDir);
    },
    [],
  );

  const columns = useMemo<ColumnDef<PublishedModuleCompletionItem>[]>(
    () => [
      {
        key: 'title',
        header: t('adminDashboard.trainingModules.columns.name'),
        colClassName: 'min-w-0',
        className: 'min-w-0',
        render: (row) => (
          <TruncatedText
            text={resolveDisplayText(row.title)}
            className={typographyClasses.tableCellPrimary}
          />
        ),
      },
      {
        key: 'published_at',
        header: t('adminDashboard.trainingModules.columns.launched'),
        sortable: true,
        sortKey: 'published_at',
        className: 'w-28 whitespace-nowrap text-spice-text-muted',
        headerClassName: 'w-28 whitespace-nowrap',
        colClassName: 'w-28',
        render: (row) => formatLaunchedDate(row.published_at),
      },
      {
        key: 'progress',
        header: t('adminDashboard.trainingModules.columns.progress'),
        colClassName: 'min-w-0 w-[22%]',
        className: 'min-w-0',
        render: (row) => {
          const total = row.assigned_sk_count ?? row.total_descendant_sk_count;
          const completed = row.completed_sk_count;
          const percent = total > 0 ? (completed / total) * 100 : 0;
          const tone = resolveModuleCompletionTone(percent);

          return (
            <ProgressBar
              value={percent}
              className="h-2 w-full"
              barClassName={tone.barClassName}
            />
          );
        },
      },
      {
        key: 'completed',
        header: t('adminDashboard.trainingModules.columns.completed'),
        className: 'w-32 whitespace-nowrap',
        headerClassName: 'w-32 whitespace-nowrap',
        colClassName: 'w-32',
        render: (row) => {
          const total = row.assigned_sk_count ?? row.total_descendant_sk_count;
          const completed = row.completed_sk_count;
          const percent = total > 0 ? (completed / total) * 100 : 0;
          const tone = resolveModuleCompletionTone(percent);

          return (
            <span
              className={cn('font-semibold tabular-nums', tone.textClassName)}
            >
              {completed}
              <span className="text-spice-text-muted">/{total}</span>
            </span>
          );
        },
      },
    ],
    [t],
  );

  if (isForbidden) return null;

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
          <DashboardWidgetErrorState
            error={query.error}
            onRetry={() => void refetch()}
          />
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
          className="min-w-0"
        >
          <Table
            data={modules}
            columns={columns}
            keyExtractor={(row) => row.module_id}
            containerClassName="overflow-x-hidden border-0 rounded-none"
            className="table-fixed w-full"
            sortBy="published_at"
            sortDir={sortDir}
            onSort={handleSort}
            emptyMessage={t('adminDashboard.trainingModules.emptyTitle')}
          />
        </InfiniteScrollContainer>
      )}
    </DashboardWidgetShell>
  );
};
