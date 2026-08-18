import type {
  DashboardGeoQueryParams,
  DashboardGeographyFilters,
} from '@/features/admin-dashboard/types/dashboard.types';
import { toGeographyQueryParams } from '@/features/modules/utils/geographyFilters';

/** Shared fetch limit so dashboard widgets dedupe RTK Query cache entries. */
export const PUBLISHED_MODULE_COMPLETIONS_QUERY_LIMIT = 50;

interface TeamActivityQueryExtras {
  limit?: number;
  offset?: number;
  user_id?: number;
  depth?: number;
}

function omitUndefined<T extends object>(values: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

export function buildDashboardGeoParams(
  geography: DashboardGeographyFilters,
): DashboardGeoQueryParams {
  return toGeographyQueryParams(geography);
}

export function buildTeamMemberQuestionsQueryArgs(
  fromDate: string,
  toDate: string,
  geography: DashboardGeographyFilters,
  userId: number,
  extra: { limit?: number; offset?: number } = {},
) {
  return {
    userId,
    from_date: fromDate,
    to_date: toDate,
    limit: extra.limit ?? 20,
    offset: extra.offset ?? 0,
    ...buildDashboardGeoParams(geography),
  };
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

export function buildModuleDemandSummaryQueryArgs(
  fromDate: string,
  toDate: string,
  geography: DashboardGeographyFilters,
  extra: { top_limit?: number } = {},
) {
  return {
    from_date: fromDate,
    to_date: toDate,
    ...(extra.top_limit !== undefined ? { top_limit: extra.top_limit } : {}),
    ...buildDashboardGeoParams(geography),
  };
}
