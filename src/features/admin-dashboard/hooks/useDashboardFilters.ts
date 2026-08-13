import { useMemo, useState } from 'react';
import type {
  DashboardFiltersState,
  DashboardGeographyFilters,
  DashboardStatusFilter,
  DashboardDurationPreset,
  TeamHierarchySortKey,
} from '@/features/admin-dashboard/types/dashboard.types';
import {
  isDashboardDateRangeValid,
  resolveDashboardDateRange,
  seedCustomRangeFromPreset,
} from '@/features/admin-dashboard/utils/dateRange';

export const EMPTY_DASHBOARD_GEOGRAPHY: DashboardGeographyFilters = {
  division: '',
  district: '',
  upazila: '',
};

export const DEFAULT_DASHBOARD_FILTERS: DashboardFiltersState = {
  durationPreset: 'this_month',
  customFrom: '',
  customTo: '',
  status: 'all',
  geography: EMPTY_DASHBOARD_GEOGRAPHY,
};

export function useDashboardFilters() {
  const [durationPreset, setDurationPresetState] =
    useState<DashboardDurationPreset>(DEFAULT_DASHBOARD_FILTERS.durationPreset);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [status, setStatus] = useState<DashboardStatusFilter>('all');
  const [geography, setGeography] = useState<DashboardGeographyFilters>(
    EMPTY_DASHBOARD_GEOGRAPHY,
  );
  const [hierarchySort, setHierarchySort] =
    useState<TeamHierarchySortKey>('default');

  const filters: DashboardFiltersState = {
    durationPreset,
    customFrom,
    customTo,
    status,
    geography,
  };

  const dateRange = useMemo(
    () => resolveDashboardDateRange(filters),
    [durationPreset, customFrom, customTo],
  );

  const isDateRangeValid = isDashboardDateRangeValid(dateRange);

  const setDurationPreset = (preset: DashboardDurationPreset) => {
    if (preset === 'custom') {
      const seeded = seedCustomRangeFromPreset({
        durationPreset,
        customFrom,
        customTo,
      });
      setCustomFrom(seeded.fromDate);
      setCustomTo(seeded.toDate);
    }
    setDurationPresetState(preset);
  };

  const clearCustomDateRange = () => {
    setDurationPresetState(DEFAULT_DASHBOARD_FILTERS.durationPreset);
    setCustomFrom('');
    setCustomTo('');
  };

  return {
    filters,
    dateRange,
    isDateRangeValid,
    setDurationPreset,
    setCustomFrom,
    setCustomTo,
    setStatus,
    setGeography,
    hierarchySort,
    setHierarchySort,
    clearCustomDateRange,
  };
}
