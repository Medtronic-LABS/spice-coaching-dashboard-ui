import { useMemo } from 'react';
import { useFetchDigitalHelpModulesQuery } from '@/features/admin-dashboard/api/dashboardApi';
import type { DigitalHelpModuleUsageItem } from '@/features/admin-dashboard/types/dashboard.types';
import {
  filterAndRankSearchedModules,
  filterAndRankSuggestedModules,
  MODULE_DEMAND_FETCH_LIMIT,
} from '@/features/admin-dashboard/utils/moduleDemand';
import { resolveDashboardQueryUiState } from '@/features/admin-dashboard/utils/queryUiState';

interface UseModuleDemandWidgetsArgs {
  fromDate: string;
  toDate: string;
  skip?: boolean;
}

export function useModuleDemandWidgets({
  fromDate,
  toDate,
  skip = false,
}: UseModuleDemandWidgetsArgs) {
  const query = useFetchDigitalHelpModulesQuery(
    {
      from_date: fromDate,
      to_date: toDate,
      limit: MODULE_DEMAND_FETCH_LIMIT,
      offset: 0,
    },
    { skip },
  );
  const ui = resolveDashboardQueryUiState(query);

  const searchedModules = useMemo(
    (): DigitalHelpModuleUsageItem[] =>
      filterAndRankSearchedModules(query.data?.modules ?? []),
    [query.data?.modules],
  );

  const suggestedModules = useMemo(
    (): DigitalHelpModuleUsageItem[] =>
      filterAndRankSuggestedModules(query.data?.modules ?? []),
    [query.data?.modules],
  );

  return {
    query,
    ui,
    searchedModules,
    suggestedModules,
  };
}
