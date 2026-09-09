import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useDashboardArgChangeLoading } from '@/features/admin-dashboard/hooks/useDashboardArgChangeLoading';

describe('useDashboardArgChangeLoading', () => {
  it('stays idle on first mount even while fetching', () => {
    const { result } = renderHook(() =>
      useDashboardArgChangeLoading('a', true),
    );
    expect(result.current).toBe(false);
  });

  it('stays loading after a filter change until the refetch settles', () => {
    const { result, rerender } = renderHook(
      (props: { filterKey: string; isFetching: boolean }) =>
        useDashboardArgChangeLoading(props.filterKey, props.isFetching),
      { initialProps: { filterKey: 'geo', isFetching: false } },
    );

    rerender({ filterKey: 'cleared', isFetching: true });
    expect(result.current).toBe(true);

    rerender({ filterKey: 'cleared', isFetching: true });
    expect(result.current).toBe(true);

    act(() => {
      rerender({ filterKey: 'cleared', isFetching: false });
    });
    expect(result.current).toBe(false);
  });

  it('clears loading when a filter change never starts a refetch', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      (props: { filterKey: string; isFetching: boolean }) =>
        useDashboardArgChangeLoading(props.filterKey, props.isFetching),
      { initialProps: { filterKey: 'geo', isFetching: false } },
    );

    rerender({ filterKey: 'cleared', isFetching: false });
    expect(result.current).toBe(true);

    act(() => {
      vi.runAllTimers();
    });
    expect(result.current).toBe(false);
    vi.useRealTimers();
  });

  it('does not show loading for a same-args refetch', () => {
    const { result, rerender } = renderHook(
      (props: { filterKey: string; isFetching: boolean }) =>
        useDashboardArgChangeLoading(props.filterKey, props.isFetching),
      { initialProps: { filterKey: 'geo', isFetching: false } },
    );

    rerender({ filterKey: 'geo', isFetching: true });
    expect(result.current).toBe(false);
  });
});
