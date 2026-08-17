export interface DashboardQuerySlice {
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  /** Optional so RTK Query uninitialized/skip states type-check cleanly. */
  data?: unknown;
}

export interface DashboardQueryUiState {
  showLoading: boolean;
  showError: boolean;
}

export function resolveDashboardQueryUiState(
  query: DashboardQuerySlice,
): DashboardQueryUiState {
  const hasData = query.data != null;
  return {
    showLoading: query.isLoading || (query.isFetching && !hasData),
    showError: query.isError && !query.isFetching && !hasData,
  };
}
