import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronIcon, CloseIcon, FiltersSlidersIcon } from '@/assets/icon';
import { Button, Select } from '@/components/ui';
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
  useLazyFetchAdminUpazilasPageQuery,
} from '@/features/modules/api/adminAssignmentApi';
import { EMPTY_DASHBOARD_GEOGRAPHY } from '@/features/admin-dashboard/hooks/useDashboardFilters';
import { cn } from '@/utils';

function countPanelFilters(
  status: DashboardStatusFilter,
  geography: DashboardGeographyFilters,
): number {
  let count = 0;
  if (status !== 'all') count += 1;
  if (geography.division.trim()) count += 1;
  if (geography.district.trim()) count += 1;
  if (geography.upazila.trim()) count += 1;
  return count;
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
  const [fetchUpazilasPage] = useLazyFetchAdminUpazilasPageQuery();
  const [upazilaOptions, setUpazilaOptions] = useState<
    Array<{ label: string; value: string }>
  >([]);

  const appliedPanelFilterCount = countPanelFilters(
    filters.status,
    filters.geography,
  );
  const hasActiveFilters = appliedPanelFilterCount > 0;

  const selectedDistrictId = useMemo(() => {
    const districtName = filtersOpen
      ? draftGeography.district
      : filters.geography.district;
    const match = districts.find((district) => district.name === districtName);
    return match?.id ?? null;
  }, [
    districts,
    draftGeography.district,
    filters.geography.district,
    filtersOpen,
  ]);

  const statusOptions = useMemo(
    () =>
      STATUS_OPTIONS.map((option) => ({
        label: t(`adminDashboard.filters.status.${option.value}`),
        value: option.value,
      })),
    [t],
  );

  const divisionOptions = useMemo(
    () => [
      { label: t('adminDashboard.filters.allDivisions'), value: '' },
      ...divisions.map((division) => ({
        label: division.name,
        value: division.name,
      })),
    ],
    [divisions, t],
  );

  const districtOptions = useMemo(
    () => [
      { label: t('adminDashboard.filters.allDistricts'), value: '' },
      ...districts.map((district) => ({
        label: district.name,
        value: district.name,
      })),
    ],
    [districts, t],
  );

  const upazilaSelectOptions = useMemo(
    () => [
      { label: t('adminDashboard.filters.allUpazilas'), value: '' },
      ...upazilaOptions,
    ],
    [t, upazilaOptions],
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
    if (!selectedDistrictId) {
      setUpazilaOptions([]);
      return;
    }
    void (async () => {
      const page = await fetchUpazilasPage({
        districtId: selectedDistrictId,
        limit: 200,
        offset: 0,
      }).unwrap();
      setUpazilaOptions(
        (page.upazilas ?? []).map((upazila) => ({
          label: upazila.name,
          value: upazila.name,
        })),
      );
    })();
  }, [fetchUpazilasPage, selectedDistrictId]);

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
            <p className="text-xs leading-relaxed text-spice-text-muted">
              {t('adminDashboard.filters.scopeNote')}
            </p>
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
                value={draftGeography.division}
                onChange={(value) =>
                  setDraftGeography({
                    ...draftGeography,
                    division: value,
                  })
                }
                className={selectClassName}
              />
            </FilterField>
            <FilterField label={t('adminDashboard.filters.district')}>
              <Select
                options={districtOptions}
                value={draftGeography.district}
                onChange={(value) =>
                  setDraftGeography({
                    ...draftGeography,
                    district: value,
                    upazila: '',
                  })
                }
                className={selectClassName}
              />
            </FilterField>
            <FilterField label={t('adminDashboard.filters.upazila')}>
              <Select
                options={upazilaSelectOptions}
                value={draftGeography.upazila}
                onChange={(value) =>
                  setDraftGeography({
                    ...draftGeography,
                    upazila: value,
                  })
                }
                className={selectClassName}
                disabled={!draftGeography.district}
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
              onChange={(event) => onCustomFromChange(event.target.value)}
              className="h-10 rounded-full border border-spice-border bg-spice-bg-tint px-3 text-sm text-spice-text-primary"
              aria-label={t('adminDashboard.filters.from')}
            />
            <span className="text-spice-text-muted">–</span>
            <input
              type="date"
              value={filters.customTo}
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
