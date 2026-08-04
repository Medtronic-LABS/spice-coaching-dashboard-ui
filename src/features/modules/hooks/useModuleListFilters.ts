import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  buildModuleListSearchParams,
  EMPTY_MODULE_LIBRARY_FILTERS,
  parseFiltersFromSearchParams,
  parseModuleLibraryTab,
  tabToLifecycleStatus,
  type ModuleLibraryFilters,
  type ModuleLibraryTab,
} from '@/features/modules/utils/moduleListFilters';

export function useModuleListFilters(isProgramManager: boolean) {
  const [searchParams, setSearchParams] = useSearchParams();

  const tab = parseModuleLibraryTab(searchParams.get('tab'), isProgramManager);
  const activeFilters = parseFiltersFromSearchParams(
    searchParams,
    tab,
    isProgramManager,
  );
  const lifecycleStatus = tabToLifecycleStatus(tab, isProgramManager);

  const applyTabAndFilters = useCallback(
    (nextTab: ModuleLibraryTab, nextFilters: ModuleLibraryFilters) => {
      setSearchParams(
        buildModuleListSearchParams(nextTab, nextFilters, isProgramManager),
        { replace: true },
      );
    },
    [isProgramManager, setSearchParams],
  );

  // Only the selected status changes when switching tabs — the globally shared
  // filters carry over unchanged.
  const setTab = useCallback(
    (nextTab: ModuleLibraryTab) => {
      applyTabAndFilters(nextTab, activeFilters);
    },
    [activeFilters, applyTabAndFilters],
  );

  const setFilters = useCallback(
    (nextFilters: ModuleLibraryFilters) => {
      applyTabAndFilters(tab, nextFilters);
    },
    [applyTabAndFilters, tab],
  );

  const clearFilters = useCallback(() => {
    applyTabAndFilters(tab, EMPTY_MODULE_LIBRARY_FILTERS);
  }, [applyTabAndFilters, tab]);

  // Resolve the search string for an externally-driven view (e.g. arriving from
  // the ingest flow with a preselected source document). Explicit URL filters
  // are retained, while filters from an earlier visit are not restored.
  const resolveExternalViewSearch = useCallback(
    (
      nextTab: ModuleLibraryTab,
      partial: Partial<ModuleLibraryFilters>,
    ): string => {
      const merged = {
        ...parseFiltersFromSearchParams(
          searchParams,
          nextTab,
          isProgramManager,
        ),
        ...partial,
      };
      return buildModuleListSearchParams(
        nextTab,
        merged,
        isProgramManager,
      ).toString();
    },
    [isProgramManager, searchParams],
  );

  return {
    tab,
    activeFilters,
    lifecycleStatus,
    setTab,
    setFilters,
    clearFilters,
    resolveExternalViewSearch,
  };
}
