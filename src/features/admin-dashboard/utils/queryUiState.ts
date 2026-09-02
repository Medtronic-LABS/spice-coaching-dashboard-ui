export interface DashboardQuerySlice {
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  /** Optional so RTK Query uninitialized/skip states type-check cleanly. */
  data?: unknown;
  /**
   * RTK Query field for the **current** args only.
   * When present on the result object (including `undefined` while a new
   * request is in flight), prefer this over `data` so arg changes show a
   * loading state instead of stale previous-args content.
   */
  currentData?: unknown;
}

export interface DashboardQueryUiState {
  showLoading: boolean;
  showError: boolean;
}

/**
 * Resolves whether the slice has a result for the active query args.
 * Prefers `currentData` when that key exists on the RTK result; falls back
 * to `data` for lightweight test stubs that omit `currentData`.
 */
function hasCurrentResult(query: DashboardQuerySlice): boolean {
  if (Object.prototype.hasOwnProperty.call(query, 'currentData')) {
    return query.currentData != null;
  }
  return query.data != null;
}

/**
 * Dashboard widget loading/error flags.
 * Arg-driven refetches (date/geo/filter/sort) show loading while
 * `currentData` is empty, even if `data` still holds a previous response.
 * Callers with infinite scroll should still gate full-widget skeletons with
 * `offset === 0` and use an inline “load more” spinner for later pages.
 */
export function resolveDashboardQueryUiState(
  query: DashboardQuerySlice,
): DashboardQueryUiState {
  const hasData = hasCurrentResult(query);
  return {
    showLoading: query.isLoading || (query.isFetching && !hasData),
    showError: query.isError && !query.isFetching && !hasData,
  };
}
