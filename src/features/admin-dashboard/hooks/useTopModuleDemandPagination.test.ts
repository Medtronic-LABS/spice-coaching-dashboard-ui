import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useAccumulatedModuleDemandPages } from '@/features/admin-dashboard/hooks/useTopModuleDemandPagination';

type TestItem = { id: string; label: string };

const baseArgs = {
  filterKey: '2026-01-01|2026-01-31||',
  fromDate: '2026-01-01',
  toDate: '2026-01-31',
  queryOffset: 0,
  getItemId: (item: TestItem) => item.id,
};

describe('useAccumulatedModuleDemandPages', () => {
  it('accumulates the first page for the active filter', async () => {
    const { result, rerender } = renderHook(
      (props: {
        pageData?: {
          from_date: string;
          to_date: string;
          offset: number;
          items: TestItem[];
        };
      }) =>
        useAccumulatedModuleDemandPages({
          ...baseArgs,
          pageData: props.pageData,
        }),
      {
        initialProps: {
          pageData: {
            from_date: '2026-01-01',
            to_date: '2026-01-31',
            offset: 0,
            items: [{ id: 'a', label: 'Alpha' }],
          },
        },
      },
    );

    await waitFor(() => {
      expect(result.current).toEqual([{ id: 'a', label: 'Alpha' }]);
    });

    rerender({
      pageData: {
        from_date: '2026-01-01',
        to_date: '2026-01-31',
        offset: 0,
        items: [
          { id: 'a', label: 'Alpha' },
          { id: 'b', label: 'Beta' },
        ],
      },
    });

    await waitFor(() => {
      expect(result.current).toHaveLength(2);
    });
  });

  it('clears accumulated items when the filter key changes', async () => {
    const { result, rerender } = renderHook(
      (props: {
        filterKey: string;
        pageData?: {
          from_date: string;
          to_date: string;
          offset: number;
          items: TestItem[];
        };
      }) =>
        useAccumulatedModuleDemandPages({
          ...baseArgs,
          filterKey: props.filterKey,
          pageData: props.pageData,
        }),
      {
        initialProps: {
          filterKey: '2026-01-01|2026-01-31||',
          pageData: {
            from_date: '2026-01-01',
            to_date: '2026-01-31',
            offset: 0,
            items: [{ id: 'a', label: 'Alpha' }],
          },
        },
      },
    );

    await waitFor(() => {
      expect(result.current).toHaveLength(1);
    });

    rerender({
      filterKey: '2026-02-01|2026-02-28||',
      pageData: undefined,
    });

    expect(result.current).toEqual([]);
  });

  it('ignores stale page data from a previous date range', async () => {
    const { result, rerender } = renderHook(
      (props: {
        pageData?: {
          from_date: string;
          to_date: string;
          offset: number;
          items: TestItem[];
        };
      }) =>
        useAccumulatedModuleDemandPages({
          ...baseArgs,
          pageData: props.pageData,
        }),
      {
        initialProps: {
          pageData: {
            from_date: '2025-12-01',
            to_date: '2025-12-31',
            offset: 0,
            items: [{ id: 'stale', label: 'Stale' }],
          },
        },
      },
    );

    expect(result.current).toEqual([]);

    rerender({
      pageData: {
        from_date: '2026-01-01',
        to_date: '2026-01-31',
        offset: 0,
        items: [{ id: 'fresh', label: 'Fresh' }],
      },
    });

    await waitFor(() => {
      expect(result.current).toEqual([{ id: 'fresh', label: 'Fresh' }]);
    });
  });

  it('updates accumulated items when fulfilledTimeStamp changes', async () => {
    const { result, rerender } = renderHook(
      (props: {
        fulfilledTimeStamp?: number;
        pageData?: {
          from_date: string;
          to_date: string;
          offset: number;
          items: TestItem[];
        };
      }) =>
        useAccumulatedModuleDemandPages({
          ...baseArgs,
          fulfilledTimeStamp: props.fulfilledTimeStamp,
          pageData: props.pageData,
        }),
      {
        initialProps: {
          fulfilledTimeStamp: 1,
          pageData: {
            from_date: '2026-01-01',
            to_date: '2026-01-31',
            offset: 0,
            items: [{ id: 'a', label: 'Alpha' }],
          },
        },
      },
    );

    await waitFor(() => {
      expect(result.current).toHaveLength(1);
    });

    rerender({
      fulfilledTimeStamp: 2,
      pageData: {
        from_date: '2026-01-01',
        to_date: '2026-01-31',
        offset: 0,
        items: [{ id: 'b', label: 'Beta' }],
      },
    });

    await waitFor(() => {
      expect(result.current).toEqual([{ id: 'b', label: 'Beta' }]);
    });
  });
});
