import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFetchDigitalHelpModulesQuery } from '@/features/admin-dashboard/api/dashboardApi';
import { DashboardActorViewToggle } from '@/features/admin-dashboard/components/DashboardActorViewToggle';
import {
  TopModuleDemandWidget,
  type TopModuleDemandRow,
} from '@/features/admin-dashboard/components/TopModuleDemandWidget';
import { ExistingModuleInlineEvidence } from '@/features/admin-dashboard/components/ModuleDemandInlineEvidence';
import { useDashboardArgChangeLoading } from '@/features/admin-dashboard/hooks/useDashboardArgChangeLoading';
import {
  buildModuleDemandFilterKey,
  useAccumulatedModuleDemandPages,
} from '@/features/admin-dashboard/hooks/useTopModuleDemandPagination';
import type {
  DashboardActorView,
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
}: TopSearchedModulesWidgetProps) => {
  const { t } = useTranslation();
  const [actorView, setActorView] = useState<DashboardActorView>('sk');
  const [offset, setOffset] = useState(0);
  const filterKey = buildModuleDemandFilterKey(
    fromDate,
    toDate,
    geography,
    actorView,
  );
  const [activeFilterKey, setActiveFilterKey] = useState(filterKey);
  if (activeFilterKey !== filterKey) {
    setActiveFilterKey(filterKey);
    setOffset(0);
  }

  const query = useFetchDigitalHelpModulesQuery(
    {
      from_date: fromDate,
      to_date: toDate,
      limit: TOP_MODULE_DEMAND_LIMIT,
      offset,
      geography,
      view: actorView,
    },
    { skip },
  );
  const ui = resolveDashboardQueryUiState(query);
  const pageData = query.currentData;
  const totalItems = pageData?.total_modules ?? 0;

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
  const argChangeLoading = useDashboardArgChangeLoading(
    filterKey,
    query.isFetching,
  );
  // Skeleton on actor/date/geo change, including a cached refetch after Clear all.
  const showLoading =
    offset === 0 &&
    (ui.showLoading ||
      argChangeLoading ||
      (query.isFetching && accumulatedModules.length === 0));

  const handleSeeMore = useCallback(() => {
    if (!hasMore || query.isFetching) return;
    setOffset((value) => value + TOP_MODULE_DEMAND_LIMIT);
  }, [hasMore, query.isFetching]);

  return (
    <TopModuleDemandWidget
      key={filterKey}
      title={t('adminDashboard.existingModules.title')}
      description={t('adminDashboard.existingModules.description')}
      titleColumnLabel={t('adminDashboard.moduleDemand.columns.title')}
      rows={rows}
      showLoading={showLoading}
      showError={ui.showError}
      error={query.error}
      onRetry={() => void query.refetch()}
      showActions={showActions}
      emptyTitle={t('adminDashboard.existingModules.emptyTitle')}
      emptyDescription={t('adminDashboard.existingModules.emptyDescription')}
      hasMore={hasMore}
      onSeeMore={handleSeeMore}
      isLoadingMore={isLoadingMore}
      headerActions={
        <DashboardActorViewToggle
          value={actorView}
          onChange={setActorView}
          label={t('adminDashboard.moduleDemand.actorViewLabel')}
        />
      }
      renderExpandedContent={(rowId) => (
        <ExistingModuleInlineEvidence
          moduleId={rowId}
          fromDate={fromDate}
          toDate={toDate}
          geography={geography}
          actorView={actorView}
        />
      )}
    />
  );
};
