import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { ChevronIcon, CloseIcon, FiltersSlidersIcon } from '@/assets/icon';
import {
  Button,
  Combobox,
  COMBOBOX_LISTBOX_SELECTOR,
  Select,
} from '@/components/ui';
import { SELECT_LISTBOX_PORTAL_SELECTOR } from '@/components/ui/Select';
import { EMPTY_DASHBOARD_GEOGRAPHY } from '@/features/admin-dashboard/hooks/useDashboardFilters';
import { useDashboardGeographyComboboxes } from '@/features/admin-dashboard/hooks/useDashboardGeographyComboboxes';
import type {
  DashboardDurationPreset,
  DashboardFiltersState,
  DashboardGeographyFilters,
} from '@/features/admin-dashboard/types/dashboard.types';
import { dashboardDurationLabel } from '@/features/admin-dashboard/utils/dateRange';
import {
  applyGeographyFilterChange,
  parseGeographyIdParam,
} from '@/features/modules/utils/geographyFilters';
import { cn } from '@/utils';
import { todayDateInputValue } from '@/utils/dateInput';

const FILTER_PANEL_WIDTH_PX = 288;
const FILTER_PANEL_GAP_PX = 8;
const VIEWPORT_EDGE_PX = 8;

function countPanelFilters(geography: DashboardGeographyFilters): number {
  let count = 0;
  if (parseGeographyIdParam(geography.divisionId)) count += 1;
  if (parseGeographyIdParam(geography.districtId)) count += 1;
  if (parseGeographyIdParam(geography.upazilaId)) count += 1;
  return count;
}

function computeFilterPanelStyle(trigger: HTMLElement): CSSProperties {
  const rect = trigger.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let left = rect.right - FILTER_PANEL_WIDTH_PX;
  left = Math.max(
    VIEWPORT_EDGE_PX,
    Math.min(left, viewportWidth - FILTER_PANEL_WIDTH_PX - VIEWPORT_EDGE_PX),
  );

  const spaceBelow =
    viewportHeight - rect.bottom - FILTER_PANEL_GAP_PX - VIEWPORT_EDGE_PX;
  const spaceAbove = rect.top - FILTER_PANEL_GAP_PX - VIEWPORT_EDGE_PX;
  const placeBelow = spaceBelow >= 240 || spaceBelow >= spaceAbove;

  return {
    position: 'fixed',
    top: placeBelow ? rect.bottom + FILTER_PANEL_GAP_PX : undefined,
    bottom: placeBelow
      ? undefined
      : viewportHeight - rect.top + FILTER_PANEL_GAP_PX,
    left,
    width: FILTER_PANEL_WIDTH_PX,
    maxHeight: Math.max(240, placeBelow ? spaceBelow : spaceAbove),
    zIndex: 60,
  };
}

function isInsideFloatingOverlay(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      `${COMBOBOX_LISTBOX_SELECTOR}, ${SELECT_LISTBOX_PORTAL_SELECTOR}`,
    ),
  );
}

interface DashboardFilterBarProps {
  filters: DashboardFiltersState;
  onDurationChange: (preset: DashboardDurationPreset) => void;
  onCustomFromChange: (value: string) => void;
  onCustomToChange: (value: string) => void;
  onGeographyChange: (geography: DashboardGeographyFilters) => void;
}

const DURATION_OPTIONS: Array<{ value: DashboardDurationPreset }> = [
  { value: 'all_time' },
  { value: 'this_week' },
  { value: 'this_month' },
  { value: 'custom' },
];

function FilterField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="block space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="text-xs font-semibold uppercase tracking-wide text-spice-text-muted"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export const DashboardFilterBar = ({
  filters,
  onDurationChange,
  onCustomFromChange,
  onCustomToChange,
  onGeographyChange,
}: DashboardFilterBarProps) => {
  const { t } = useTranslation();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>();
  const [draftGeography, setDraftGeography] =
    useState<DashboardGeographyFilters>(filters.geography);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const appliedPanelFilterCount = countPanelFilters(filters.geography);
  const hasActiveFilters = appliedPanelFilterCount > 0;

  const geographyLabels = useMemo(
    () => ({
      allDivisions: t('adminDashboard.filters.allDivisions'),
      allDistricts: t('adminDashboard.filters.allDistricts'),
      allUpazilas: t('adminDashboard.filters.allUpazilas'),
    }),
    [t],
  );

  const patchDraftGeography = (patch: Partial<DashboardGeographyFilters>) => {
    setDraftGeography((current) => applyGeographyFilterChange(current, patch));
  };

  const { division, district, upazila } = useDashboardGeographyComboboxes({
    enabled: filtersOpen,
    geography: draftGeography,
    onGeographyPatch: patchDraftGeography,
    labels: geographyLabels,
  });

  const durationOptions = useMemo(
    () =>
      DURATION_OPTIONS.map((option) => ({
        label: dashboardDurationLabel(option.value, t),
        value: option.value,
      })),
    [t],
  );

  const updatePanelPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    setPanelStyle(computeFilterPanelStyle(trigger));
  }, []);

  useLayoutEffect(() => {
    if (!filtersOpen) return undefined;
    updatePanelPosition();
    return undefined;
  }, [filtersOpen, updatePanelPosition]);

  useEffect(() => {
    if (!filtersOpen) return undefined;

    const onReposition = () => updatePanelPosition();
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [filtersOpen, updatePanelPosition]);

  useEffect(() => {
    if (!filtersOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      if (isInsideFloatingOverlay(target)) return;
      setFiltersOpen(false);
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
    setDraftGeography(filters.geography);
    if (triggerRef.current) {
      setPanelStyle(computeFilterPanelStyle(triggerRef.current));
    }
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
    onGeographyChange(draftGeography);
    setFiltersOpen(false);
  };

  const handleClearAllFilters = () => {
    setDraftGeography(EMPTY_DASHBOARD_GEOGRAPHY);
    onGeographyChange(EMPTY_DASHBOARD_GEOGRAPHY);
    setFiltersOpen(false);
  };

  const maxSelectableDate = todayDateInputValue();
  const filterSelectTriggerClassName =
    'rounded-lg border-spice-border bg-spice-bg-tint text-sm';
  const filterComboboxClassName = 'w-full';

  const filterPanel =
    filtersOpen && panelStyle
      ? createPortal(
          <div
            ref={panelRef}
            style={panelStyle}
            className="overflow-visible rounded-lg border border-spice-border bg-spice-bg-surface p-4 shadow-spiceKpi"
            role="dialog"
            aria-label={t('adminDashboard.filters.panelLabel')}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="space-y-4">
              <FilterField
                label={t('adminDashboard.filters.division')}
                htmlFor="dashboard-filter-division"
              >
                <Combobox
                  id="dashboard-filter-division"
                  aria-label={t('adminDashboard.filters.division')}
                  className={filterComboboxClassName}
                  {...division}
                />
              </FilterField>
              <FilterField
                label={t('adminDashboard.filters.district')}
                htmlFor="dashboard-filter-district"
              >
                <Combobox
                  id="dashboard-filter-district"
                  aria-label={t('adminDashboard.filters.district')}
                  className={filterComboboxClassName}
                  {...district}
                />
              </FilterField>
              <FilterField
                label={t('adminDashboard.filters.upazila')}
                htmlFor="dashboard-filter-upazila"
              >
                <Combobox
                  id="dashboard-filter-upazila"
                  aria-label={t('adminDashboard.filters.upazila')}
                  className={filterComboboxClassName}
                  {...upazila}
                />
              </FilterField>
              <div className="space-y-3 border-t border-spice-border pt-3">
                <Button
                  type="button"
                  variant="primary"
                  className="h-10 w-full rounded-lg"
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
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          className={cn(
            'inline-flex h-10 items-center gap-2 rounded-lg border bg-spice-bg-surface px-4 text-sm font-medium text-spice-text-primary transition',
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
        {filterPanel}
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
          className="min-w-[9rem]"
          triggerClassName={filterSelectTriggerClassName}
        />
        {filters.durationPreset === 'custom' ? (
          <>
            <input
              type="date"
              value={filters.customFrom}
              max={maxSelectableDate}
              onChange={(event) => onCustomFromChange(event.target.value)}
              className="h-10 rounded-lg border border-spice-border bg-spice-bg-tint px-3 text-sm text-spice-text-primary"
              aria-label={t('adminDashboard.filters.from')}
            />
            <span className="text-spice-text-muted">–</span>
            <input
              type="date"
              value={filters.customTo}
              max={maxSelectableDate}
              onChange={(event) => onCustomToChange(event.target.value)}
              className="h-10 rounded-lg border border-spice-border bg-spice-bg-tint px-3 text-sm text-spice-text-primary"
              aria-label={t('adminDashboard.filters.to')}
            />
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-spice-text-muted hover:bg-spice-bg-tint hover:text-spice-text-primary"
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
