import type { DashboardDateParams } from '@/features/admin-dashboard/api/dashboardApi';

/** Shared fetch limit so dashboard widgets dedupe RTK Query cache entries. */
export const PUBLISHED_MODULE_COMPLETIONS_QUERY_LIMIT = 50;

export function buildPublishedModuleCompletionsQueryArgs(
  fromDate: string,
  toDate: string,
): DashboardDateParams & { limit: number; offset: number } {
  return {
    from_date: fromDate,
    to_date: toDate,
    limit: PUBLISHED_MODULE_COMPLETIONS_QUERY_LIMIT,
    offset: 0,
  };
}
