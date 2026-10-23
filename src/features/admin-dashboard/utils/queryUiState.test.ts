import { describe, expect, it } from 'vitest';
import { resolveDashboardQueryUiState } from '@/features/admin-dashboard/utils/queryUiState';

describe('resolveDashboardQueryUiState', () => {
  it('shows loading on first fetch', () => {
    expect(
      resolveDashboardQueryUiState({
        isLoading: true,
        isFetching: true,
        isError: false,
        data: undefined,
      }),
    ).toEqual({ showLoading: true, showError: false });
  });

  it('shows loading while refetching without cached data', () => {
    expect(
      resolveDashboardQueryUiState({
        isLoading: false,
        isFetching: true,
        isError: true,
        data: undefined,
      }),
    ).toEqual({ showLoading: true, showError: false });
  });

  it('shows error after failed fetch completes', () => {
    expect(
      resolveDashboardQueryUiState({
        isLoading: false,
        isFetching: false,
        isError: true,
        data: undefined,
      }),
    ).toEqual({ showLoading: false, showError: true });
  });

  it('shows content when data exists even if stale error is set', () => {
    expect(
      resolveDashboardQueryUiState({
        isLoading: false,
        isFetching: false,
        isError: true,
        data: { items: [] },
      }),
    ).toEqual({ showLoading: false, showError: false });
  });

  it('treats omitted data the same as undefined', () => {
    expect(
      resolveDashboardQueryUiState({
        isLoading: false,
        isFetching: false,
        isError: false,
      }),
    ).toEqual({ showLoading: false, showError: false });
  });

  it('shows loading on arg change when currentData is empty but data is stale', () => {
    expect(
      resolveDashboardQueryUiState({
        isLoading: false,
        isFetching: true,
        isError: false,
        data: { items: ['stale'] },
        currentData: undefined,
      }),
    ).toEqual({ showLoading: true, showError: false });
  });

  it('keeps content when currentData exists during a same-args refetch', () => {
    expect(
      resolveDashboardQueryUiState({
        isLoading: false,
        isFetching: true,
        isError: false,
        data: { items: ['ok'] },
        currentData: { items: ['ok'] },
      }),
    ).toEqual({ showLoading: false, showError: false });
  });
});
