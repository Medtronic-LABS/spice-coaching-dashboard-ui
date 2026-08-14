import type {
  DashboardGeoQueryParams,
  DashboardGeographyFilters,
} from '@/features/admin-dashboard/types/dashboard.types';

/** Shared fetch limit so dashboard widgets dedupe RTK Query cache entries. */
export const PUBLISHED_MODULE_COMPLETIONS_QUERY_LIMIT = 50;

interface TeamActivityQueryExtras {
  limit?: number;
  offset?: number;
  user_id?: number;
  depth?: number;
}

function omitUndefined<T extends Record<string, unknown>>(
  values: T,
): Partial<T> {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

export function buildDashboardGeoParams(
  geography: DashboardGeographyFilters,
): DashboardGeoQueryParams {
  const params: DashboardGeoQueryParams = {};
  if (geography.division.trim()) params.division = geography.division.trim();
  if (geography.district.trim()) params.district = geography.district.trim();
  if (geography.upazila.trim()) params.upazila_id = geography.upazila.trim();
  return params;
}

export function buildTeamActivityQueryArgs(
  fromDate: string,
  toDate: string,
  geography: DashboardGeographyFilters,
  extra: TeamActivityQueryExtras = {},
) {
  return {
    from_date: fromDate,
    to_date: toDate,
    ...buildDashboardGeoParams(geography),
    ...omitUndefined(extra),
  };
}

export function buildPublishedModuleCompletionsQueryArgs(
  fromDate: string,
  toDate: string,
  geography: DashboardGeographyFilters,
  extra: { limit?: number; offset?: number } = {},
) {
  return {
    from_date: fromDate,
    to_date: toDate,
    limit: extra.limit ?? PUBLISHED_MODULE_COMPLETIONS_QUERY_LIMIT,
    offset: extra.offset ?? 0,
    ...buildDashboardGeoParams(geography),
  };
}

export function buildDocumentUsageDateGeoArgs(
  fromDate: string,
  toDate: string,
  geography: DashboardGeographyFilters,
) {
  return {
    from: fromDate,
    to: toDate,
    ...buildDashboardGeoParams(geography),
  };
}
