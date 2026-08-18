import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronIcon, CloseIcon, FiltersSlidersIcon } from '@/assets/icon';
import { Button, Select, type SelectOption } from '@/components/ui';
import { EMPTY_DASHBOARD_GEOGRAPHY } from '@/features/admin-dashboard/hooks/useDashboardFilters';
import type {
  DashboardDurationPreset,
  DashboardFiltersState,
  DashboardGeographyFilters,
  DashboardStatusFilter,
} from '@/features/admin-dashboard/types/dashboard.types';
import { dashboardDurationLabel } from '@/features/admin-dashboard/utils/dateRange';
import {
  useFetchAdminDistrictsQuery,
  useFetchAdminDivisionsQuery,
  useFetchAdminUpazilasQuery,
} from '@/features/modules/api/adminAssignmentApi';
import {
  applyGeographyFilterChange,
  parseGeographyId,
  parseGeographyIdParam,
} from '@/features/modules/utils/geographyFilters';
import { cn } from '@/utils';
import { todayDateInputValue } from '@/utils/dateInput';

function countPanelFilters(
  status: DashboardStatusFilter,
  geography: DashboardGeographyFilters,
): number {
  let count = 0;
  if (status !== 'all') count += 1;
  if (parseGeographyIdParam(geography.divisionId)) count += 1;
  if (parseGeographyIdParam(geography.districtId)) count += 1;
  if (parseGeographyIdParam(geography.upazilaId)) count += 1;
  return count;
}

function toIdSelectOptions(
  allLabel: string,
  items: Array<{ id: number; name: string }>,
): SelectOption[] {
  return [
    { label: allLabel, value: '' },
    ...items.map((item) => ({
      label: item.name,
      value: String(item.id),
    })),
  ];
}

interface DashboardFilterBarProps {
  filters: DashboardFiltersState;
  onDurationChange: (preset: DashboardDurationPreset) => void;
  onCustomFromChange: (value: string) => void;
  onCustomToChange: (value: string) => void;
  onStatusChange: (status: DashboardStatusFilter) => void;
  onGeographyChange: (geography: DashboardGeographyFilters) => void;
}

const DURATION_OPTIONS: Array<{ value: DashboardDurationPreset }> = [
  { value: 'all_time' },
  { value: 'this_week' },
  { value: 'this_month' },
  { value: 'custom' },
];

const STATUS_OPTIONS: Array<{ value: DashboardStatusFilter }> = [
  { value: 'all' },
  { value: 'on_track' },
  { value: 'at_risk' },
];

function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-spice-text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

export const DashboardFilterBar = ({
  filters,
  onDurationChange,
  onCustomFromChange,
  onCustomToChange,
  onStatusChange,
  onGeographyChange,
}: DashboardFilterBarProps) => {
  const { t } = useTranslation();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftStatus, setDraftStatus] = useState<DashboardStatusFilter>(
    filters.status,
  );
  const [draftGeography, setDraftGeography] =
    useState<DashboardGeographyFilters>(filters.geography);
  const filtersRef = useRef<HTMLDivElement>(null);
  const { data: districts = [] } = useFetchAdminDistrictsQuery();
  const { data: divisions = [] } = useFetchAdminDivisionsQuery();
  const { data: upazilas = [] } = useFetchAdminUpazilasQuery();

  const appliedPanelFilterCount = countPanelFilters(
    filters.status,
    filters.geography,
  );
  const hasActiveFilters = appliedPanelFilterCount > 0;

  const activeGeography = filtersOpen ? draftGeography : filters.geography;
  const selectedDivisionId = parseGeographyId(activeGeography.divisionId);
  const selectedDistrictId = parseGeographyId(activeGeography.districtId);

  const visibleDistricts = useMemo(() => {
    if (selectedDivisionId === undefined) return districts;
    return districts.filter(
      (district) => district.division_id === selectedDivisionId,
    );
  }, [districts, selectedDivisionId]);

  const visibleUpazilas = useMemo(() => {
    if (selectedDistrictId !== undefined) {
      return upazilas.filter(
        (upazila) => upazila.district_id === selectedDistrictId,
      );
    }
    if (selectedDivisionId !== undefined) {
      const districtIds = new Set(
        visibleDistricts.map((district) => district.id),
      );
      return upazilas.filter((upazila) => districtIds.has(upazila.district_id));
    }
    return upazilas;
  }, [selectedDistrictId, selectedDivisionId, upazilas, visibleDistricts]);

  const statusOptions = useMemo(
    () =>
      STATUS_OPTIONS.map((option) => ({
        label: t(`adminDashboard.filters.status.${option.value}`),
        value: option.value,
      })),
    [t],
  );

  const divisionOptions = useMemo(
    () =>
      toIdSelectOptions(t('adminDashboard.filters.allDivisions'), divisions),
    [divisions, t],
  );

  const districtOptions = useMemo(
    () =>
      toIdSelectOptions(
        t('adminDashboard.filters.allDistricts'),
        visibleDistricts,
      ),
    [t, visibleDistricts],
  );

  const upazilaSelectOptions = useMemo(
    () =>
      toIdSelectOptions(
        t('adminDashboard.filters.allUpazilas'),
        visibleUpazilas,
      ),
    [t, visibleUpazilas],
  );

  const durationOptions = useMemo(
    () =>
      DURATION_OPTIONS.map((option) => ({
        label: dashboardDurationLabel(option.value, t),
        value: option.value,
      })),
    [t],
  );

  useEffect(() => {
    if (!filtersOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        filtersRef.current &&
        !filtersRef.current.contains(event.target as Node)
      ) {
        setFiltersOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [filtersOpen]);

  const clearCustomRange = () => {
    onCustomFromChange('');
    onCustomToChange('');
    onDurationChange('this_month');
  };

  const openFiltersPanel = () => {
    setDraftStatus(filters.status);
    setDraftGeography(filters.geography);
    setFiltersOpen(true);
  };

  const toggleFiltersPanel = () => {
    if (filtersOpen) {
      setFiltersOpen(false);
      return;
    }
    openFiltersPanel();
  };

  const handleApplyFilters = () => {
    onStatusChange(draftStatus);
    onGeographyChange(draftGeography);
    setFiltersOpen(false);
  };

  const handleClearAllFilters = () => {
    setDraftStatus('all');
    setDraftGeography(EMPTY_DASHBOARD_GEOGRAPHY);
  };

  const patchDraftGeography = (patch: Partial<DashboardGeographyFilters>) => {
    setDraftGeography((current) => applyGeographyFilterChange(current, patch));
  };

  const maxSelectableDate = todayDateInputValue();
  const selectClassName =
    'h-10 w-full rounded-full border border-spice-border bg-spice-bg-tint px-3 text-sm';

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <div className="relative" ref={filtersRef}>
        <button
          type="button"
          className={cn(
            'inline-flex h-10 items-center gap-2 rounded-full border bg-spice-bg-surface px-4 text-sm font-medium text-spice-text-primary transition',
            hasActiveFilters
              ? 'border-spice-brand-primary ring-1 ring-spice-brand-primary/20'
              : 'border-spice-border hover:border-spice-border-mid',
          )}
          aria-expanded={filtersOpen}
          aria-haspopup="true"
          onClick={toggleFiltersPanel}
        >
          <FiltersSlidersIcon className="h-4 w-4" />
          {t('adminDashboard.filters.button')}
          {appliedPanelFilterCount > 0 ? (
            <span
              className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-spice-brand-primary px-1.5 text-xs font-semibold text-white"
              aria-label={t('adminDashboard.filters.activeCount', {
                count: appliedPanelFilterCount,
              })}
            >
              {appliedPanelFilterCount}
            </span>
          ) : null}
          <ChevronIcon className="h-3.5 w-3.5" expanded={filtersOpen} />
        </button>

        {filtersOpen ? (
          <div
            className="absolute right-0 z-30 mt-2 w-72 space-y-4 rounded-xl border border-spice-border bg-spice-bg-surface p-4 shadow-spiceKpi"
            role="dialog"
            aria-label={t('adminDashboard.filters.panelLabel')}
          >
            <FilterField label={t('adminDashboard.filters.statusLabel')}>
              <Select
                options={statusOptions}
                value={draftStatus}
                onChange={(value) =>
                  setDraftStatus(value as DashboardStatusFilter)
                }
                className={selectClassName}
              />
            </FilterField>
            <FilterField label={t('adminDashboard.filters.division')}>
              <Select
                options={divisionOptions}
                value={draftGeography.divisionId}
                onChange={(value) => patchDraftGeography({ divisionId: value })}
                className={selectClassName}
              />
            </FilterField>
            <FilterField label={t('adminDashboard.filters.district')}>
              <Select
                options={districtOptions}
                value={draftGeography.districtId}
                onChange={(value) => patchDraftGeography({ districtId: value })}
                className={selectClassName}
              />
            </FilterField>
            <FilterField label={t('adminDashboard.filters.upazila')}>
              <Select
                options={upazilaSelectOptions}
                value={draftGeography.upazilaId}
                onChange={(value) => patchDraftGeography({ upazilaId: value })}
                className={selectClassName}
              />
            </FilterField>
            <div className="space-y-3 border-t border-spice-border pt-3">
              <Button
                type="button"
                variant="primary"
                className="h-10 w-full rounded-full"
                onClick={handleApplyFilters}
              >
                {t('adminDashboard.filters.apply')}
              </Button>
              <button
                type="button"
                className="w-full text-center text-sm font-semibold text-spice-semantic-warning hover:underline"
                onClick={handleClearAllFilters}
              >
                {t('adminDashboard.filters.clearAll')}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-spice-text-primary">
          {t('adminDashboard.filters.durationLabel')}
        </span>
        <Select
          options={durationOptions}
          value={filters.durationPreset}
          onChange={(value) =>
            onDurationChange(value as DashboardDurationPreset)
          }
          className="h-10 min-w-[9rem] rounded-full border border-spice-border bg-spice-bg-tint px-3 text-sm"
        />
        {filters.durationPreset === 'custom' ? (
          <>
            <input
              type="date"
              value={filters.customFrom}
              max={maxSelectableDate}
              onChange={(event) => onCustomFromChange(event.target.value)}
              className="h-10 rounded-full border border-spice-border bg-spice-bg-tint px-3 text-sm text-spice-text-primary"
              aria-label={t('adminDashboard.filters.from')}
            />
            <span className="text-spice-text-muted">–</span>
            <input
              type="date"
              value={filters.customTo}
              max={maxSelectableDate}
              onChange={(event) => onCustomToChange(event.target.value)}
              className="h-10 rounded-full border border-spice-border bg-spice-bg-tint px-3 text-sm text-spice-text-primary"
              aria-label={t('adminDashboard.filters.to')}
            />
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-spice-text-muted hover:bg-spice-bg-tint hover:text-spice-text-primary"
              aria-label={t('adminDashboard.filters.clearCustomRange')}
              onClick={clearCustomRange}
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
};
