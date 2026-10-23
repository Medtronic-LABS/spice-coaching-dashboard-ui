import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  buildDashboardListFilterKey,
  useAccumulatedFilterPages,
  useFilterKeyedOffset,
} from '@/features/admin-dashboard/hooks/useDashboardListPagination';
import { EMPTY_DASHBOARD_GEOGRAPHY } from '@/features/admin-dashboard/hooks/useDashboardFilters';

type TestItem = { id: string; label: string };

const getItemId = (item: TestItem) => item.id;

describe('buildDashboardListFilterKey', () => {
  it('joins date, geography, and extras', () => {
    expect(
      buildDashboardListFilterKey(
        '2026-01-01',
        '2026-01-31',
        {
          ...EMPTY_DASHBOARD_GEOGRAPHY,
          divisionId: '1',
          districtId: '10',
        },
        'po',
        'name',
      ),
    ).toBe('2026-01-01|2026-01-31|1|10||po|name');
  });
});

describe('useFilterKeyedOffset', () => {
  it('resets offset to 0 when the filter key changes', async () => {
    const { result, rerender } = renderHook(
      (props: { filterKey: string }) => useFilterKeyedOffset(props.filterKey),
      { initialProps: { filterKey: 'a' } },
    );

    act(() => {
      result.current[1](40);
    });
    expect(result.current[0]).toBe(40);

    rerender({ filterKey: 'b' });
    expect(result.current[0]).toBe(0);
  });
});

describe('useAccumulatedFilterPages', () => {
  it('clears accumulated items immediately when the filter key changes', async () => {
    const { result, rerender } = renderHook(
      (props: {
        filterKey: string;
        pageItems?: TestItem[];
        queryOffset: number;
      }) =>
        useAccumulatedFilterPages({
          filterKey: props.filterKey,
          queryOffset: props.queryOffset,
          pageItems: props.pageItems,
          getItemId,
        }),
      {
        initialProps: {
          filterKey: 'range-a',
          queryOffset: 0,
          pageItems: [{ id: 'a', label: 'Alpha' }],
        },
      },
    );

    await waitFor(() => {
      expect(result.current).toEqual([{ id: 'a', label: 'Alpha' }]);
    });

    rerender({
      filterKey: 'range-b',
      queryOffset: 0,
      pageItems: undefined,
    });

    expect(result.current).toEqual([]);
  });

  it('replaces offset-0 page when the same ids return updated objects', async () => {
    const first = [{ id: 'a', label: 'Old' }];
    const second = [{ id: 'a', label: 'New' }];

    const { result, rerender } = renderHook(
      (props: { pageItems?: TestItem[] }) =>
        useAccumulatedFilterPages({
          filterKey: 'range-a',
          queryOffset: 0,
          pageItems: props.pageItems,
          getItemId,
        }),
      { initialProps: { pageItems: first } },
    );

    await waitFor(() => {
      expect(result.current).toEqual(first);
    });

    rerender({ pageItems: second });

    await waitFor(() => {
      expect(result.current).toEqual(second);
    });
  });
});
