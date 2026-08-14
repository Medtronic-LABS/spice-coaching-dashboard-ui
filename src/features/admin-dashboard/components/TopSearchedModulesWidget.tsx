import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFetchDigitalHelpModulesQuery } from '@/features/admin-dashboard/api/dashboardApi';
import {
  TopModuleDemandWidget,
  type TopModuleDemandRow,
} from '@/features/admin-dashboard/components/TopModuleDemandWidget';
import { ExistingModuleInlineEvidence } from '@/features/admin-dashboard/components/ModuleDemandInlineEvidence';
import {
  buildModuleDemandFilterKey,
  useAccumulatedModuleDemandPages,
} from '@/features/admin-dashboard/hooks/useTopModuleDemandPagination';
import type {
  DashboardGeographyFilters,
  DigitalHelpModuleUsageItem,
} from '@/features/admin-dashboard/types/dashboard.types';
import {
  existingModuleSearchCount,
  TOP_MODULE_DEMAND_LIMIT,
} from '@/features/admin-dashboard/utils/moduleDemand';
import { resolveDashboardQueryUiState } from '@/features/admin-dashboard/utils/queryUiState';
import { resolveDisplayText } from '@/config/deploymentLocale';

interface TopSearchedModulesWidgetProps {
  fromDate: string;
  toDate: string;
  geography: DashboardGeographyFilters;
  skip?: boolean;
  showActions: boolean;
  assignLabel: string;
  onAssign: (moduleId: string, title: string) => void;
  hideSkName?: boolean;
}

function mapModulesToRows(
  modules: DigitalHelpModuleUsageItem[],
  showActions: boolean,
  assignLabel: string,
  onAssign: (moduleId: string, title: string) => void,
): TopModuleDemandRow[] {
  return modules
    .filter((module) => existingModuleSearchCount(module) > 0)
    .map((module) => {
      const title = resolveDisplayText(module.title);
      return {
        id: module.module_id,
        title,
        searchCount: existingModuleSearchCount(module),
        actionLabel: showActions ? assignLabel : undefined,
        onAction: showActions
          ? () => onAssign(module.module_id, title)
          : undefined,
      };
    });
}

export const TopSearchedModulesWidget = ({
  fromDate,
  toDate,
  geography,
  skip = false,
  showActions,
  assignLabel,
  onAssign,
  hideSkName = false,
}: TopSearchedModulesWidgetProps) => {
  const { t } = useTranslation();
  const [offset, setOffset] = useState(0);
  const filterKey = buildModuleDemandFilterKey(fromDate, toDate, geography);

  const query = useFetchDigitalHelpModulesQuery(
    {
      from_date: fromDate,
      to_date: toDate,
      limit: TOP_MODULE_DEMAND_LIMIT,
      offset,
      geography,
    },
    { skip },
  );
  const ui = resolveDashboardQueryUiState(query);
  const pageData = query.currentData;
  const totalItems = pageData?.total_modules ?? query.data?.total_modules ?? 0;

  useEffect(() => {
    setOffset(0);
  }, [filterKey]);

  const accumulatedModules = useAccumulatedModuleDemandPages({
    filterKey,
    fromDate,
    toDate,
    queryOffset: offset,
    pageData: pageData
      ? {
          from_date: pageData.from_date,
          to_date: pageData.to_date,
          offset: pageData.offset,
          items: pageData.modules,
        }
      : undefined,
    getItemId: (module) => module.module_id,
    fulfilledTimeStamp: query.fulfilledTimeStamp,
  });

  const rows = useMemo(
    () =>
      mapModulesToRows(accumulatedModules, showActions, assignLabel, onAssign),
    [accumulatedModules, showActions, assignLabel, onAssign],
  );

  const hasMore =
    (pageData?.offset ?? offset) + TOP_MODULE_DEMAND_LIMIT < totalItems;
  const isLoadingMore = offset > 0 && query.isFetching;
  const showLoading =
    offset === 0 && rows.length === 0 && (ui.showLoading || query.isFetching);

  const handleSeeMore = useCallback(() => {
    if (!hasMore || query.isFetching) return;
    setOffset((value) => value + TOP_MODULE_DEMAND_LIMIT);
  }, [hasMore, query.isFetching]);

  const handleRefresh = useCallback(() => {
    if (offset !== 0) {
      setOffset(0);
      return;
    }
    void query.refetch();
  }, [offset, query]);

  return (
    <TopModuleDemandWidget
      title={t('adminDashboard.existingModules.title')}
      description={t('adminDashboard.existingModules.description')}
      titleColumnLabel={t('adminDashboard.moduleDemand.columns.title')}
      rows={rows}
      showLoading={showLoading}
      showError={ui.showError}
      onRetry={() => void query.refetch()}
      onRefresh={handleRefresh}
      isRefreshing={query.isFetching && offset === 0 && rows.length > 0}
      showActions={showActions}
      emptyTitle={t('adminDashboard.existingModules.emptyTitle')}
      emptyDescription={t('adminDashboard.existingModules.emptyDescription')}
      hasMore={hasMore}
      onSeeMore={handleSeeMore}
      isLoadingMore={isLoadingMore}
      renderExpandedContent={(rowId) => (
        <ExistingModuleInlineEvidence
          moduleId={rowId}
          fromDate={fromDate}
          toDate={toDate}
          geography={geography}
          hideSkName={hideSkName}
        />
      )}
    />
  );
};
