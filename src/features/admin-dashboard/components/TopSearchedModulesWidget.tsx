import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFetchDigitalHelpModulesQuery } from '@/features/admin-dashboard/api/dashboardApi';
import {
  TopModuleDemandWidget,
  type TopModuleDemandRow,
} from '@/features/admin-dashboard/components/TopModuleDemandWidget';
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
  onSelectModule: (moduleId: string, title: string) => void;
}

function mapModulesToRows(
  modules: DigitalHelpModuleUsageItem[],
  showActions: boolean,
  assignLabel: string,
  onAssign: (moduleId: string, title: string) => void,
): TopModuleDemandRow[] {
  return modules
    .filter((module) => existingModuleSearchCount(module) > 0)
    .map((module, index) => {
      const title = resolveDisplayText(module.title);
      return {
        id: module.module_id,
        title,
        searchCount: existingModuleSearchCount(module),
        rank: index + 1,
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
  onSelectModule,
}: TopSearchedModulesWidgetProps) => {
  const { t } = useTranslation();
  const [offset, setOffset] = useState(0);
  const [accumulatedModules, setAccumulatedModules] = useState<
    DigitalHelpModuleUsageItem[]
  >([]);
  const filterKey = `${fromDate}|${toDate}|${geography.division}|${geography.district}|${geography.upazila}`;

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
    setAccumulatedModules([]);
  }, [filterKey]);

  useEffect(() => {
    if (!pageData?.modules) return;
    if (pageData.from_date !== fromDate || pageData.to_date !== toDate) return;

    setAccumulatedModules((prev) => {
      if (pageData.offset === 0) {
        return pageData.modules;
      }
      const existingIds = new Set(prev.map((module) => module.module_id));
      return [
        ...prev,
        ...pageData.modules.filter(
          (module) => !existingIds.has(module.module_id),
        ),
      ];
    });
  }, [fromDate, pageData, toDate]);

  const rows = useMemo(
    () =>
      mapModulesToRows(accumulatedModules, showActions, assignLabel, onAssign),
    [accumulatedModules, showActions, assignLabel, onAssign],
  );

  const hasMore =
    (pageData?.offset ?? offset) + TOP_MODULE_DEMAND_LIMIT < totalItems;
  const isLoadingMore = offset > 0 && query.isFetching;

  const handleSeeMore = useCallback(() => {
    if (!hasMore || query.isFetching) return;
    setOffset((value) => value + TOP_MODULE_DEMAND_LIMIT);
  }, [hasMore, query.isFetching]);

  const handleRefresh = useCallback(() => {
    if (offset !== 0) {
      setOffset(0);
      setAccumulatedModules([]);
      return;
    }
    setAccumulatedModules([]);
    void query.refetch();
  }, [offset, query]);

  return (
    <TopModuleDemandWidget
      title={t('adminDashboard.existingModules.title')}
      description={t('adminDashboard.existingModules.description')}
      titleColumnLabel={t('adminDashboard.moduleDemand.columns.title')}
      rows={rows}
      showLoading={ui.showLoading && offset === 0}
      showError={ui.showError}
      onRetry={() => void query.refetch()}
      onRefresh={handleRefresh}
      isRefreshing={query.isFetching && offset === 0}
      showActions={showActions}
      emptyTitle={t('adminDashboard.existingModules.emptyTitle')}
      emptyDescription={t('adminDashboard.existingModules.emptyDescription')}
      hasMore={hasMore}
      onSeeMore={handleSeeMore}
      isLoadingMore={isLoadingMore}
      onRowClick={(rowId) => {
        const row = rows.find((item) => item.id === rowId);
        if (!row) return;
        onSelectModule(rowId, row.title);
      }}
    />
  );
};
