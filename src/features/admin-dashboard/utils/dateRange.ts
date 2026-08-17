import type {
  DashboardDateRange,
  DashboardDurationPreset,
  DashboardFiltersState,
} from '@/features/admin-dashboard/types/dashboard.types';

const ALL_TIME_START = '2020-01-01';

function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfUtcWeek(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setUTCDate(copy.getUTCDate() + diff);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

function startOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function resolveDashboardDateRange(
  filters: Pick<
    DashboardFiltersState,
    'durationPreset' | 'customFrom' | 'customTo'
  >,
): DashboardDateRange {
  const today = new Date();
  const toDate = formatUtcDate(today);

  switch (filters.durationPreset) {
    case 'this_week':
      return {
        fromDate: formatUtcDate(startOfUtcWeek(today)),
        toDate,
      };
    case 'this_month':
      return {
        fromDate: formatUtcDate(startOfUtcMonth(today)),
        toDate,
      };
    case 'custom':
      return {
        fromDate: filters.customFrom.trim(),
        toDate: filters.customTo.trim(),
      };
    case 'all_time':
    default:
      return {
        fromDate: ALL_TIME_START,
        toDate,
      };
  }
}

export function isDashboardDateRangeValid(range: DashboardDateRange): boolean {
  const from = range.fromDate.trim();
  const to = range.toDate.trim();
  if (!from || !to) return false;
  return from <= to;
}

/** Seeds Custom range inputs from the currently active preset range. */
export function seedCustomRangeFromPreset(
  filters: Pick<
    DashboardFiltersState,
    'durationPreset' | 'customFrom' | 'customTo'
  >,
): DashboardDateRange {
  if (filters.durationPreset === 'custom') {
    const current = resolveDashboardDateRange(filters);
    if (isDashboardDateRangeValid(current)) {
      return current;
    }
  }

  return resolveDashboardDateRange({
    durationPreset:
      filters.durationPreset === 'custom'
        ? 'this_month'
        : filters.durationPreset,
    customFrom: '',
    customTo: '',
  });
}

export function dashboardDurationLabel(
  preset: DashboardDurationPreset,
  t: (key: string) => string,
): string {
  switch (preset) {
    case 'all_time':
      return t('adminDashboard.filters.duration.allTime');
    case 'this_week':
      return t('adminDashboard.filters.duration.thisWeek');
    case 'this_month':
      return t('adminDashboard.filters.duration.thisMonth');
    case 'custom':
      return t('adminDashboard.filters.duration.custom');
    default:
      return preset;
  }
}
