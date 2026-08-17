import { useMemo, useRef, useState } from 'react';
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
import { clampDateInputToToday } from '@/utils/dateInput';

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
  const [customFrom, setCustomFromState] = useState('');
  const [customTo, setCustomToState] = useState('');
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
  const queryDateRangeRef = useRef(dateRange);
  if (isDateRangeValid) {
    queryDateRangeRef.current = dateRange;
  }
  const queryDateRange = queryDateRangeRef.current;

  const setCustomFrom = (value: string) => {
    setCustomFromState(clampDateInputToToday(value));
  };

  const setCustomTo = (value: string) => {
    setCustomToState(clampDateInputToToday(value));
  };

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
    queryDateRange,
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
