import type { DashboardDateParams } from '@/features/admin-dashboard/api/dashboardApi';

/** Shared fetch limit so paired dashboard widgets dedupe RTK Query cache entries. */
export const PUBLISHED_MODULE_COMPLETIONS_QUERY_LIMIT = 50;

/** Module Performance widget shows a shorter ranked list from the shared fetch. */
export const MODULE_PERFORMANCE_DISPLAY_LIMIT = 20;

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
