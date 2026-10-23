import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type { DashboardGeographyFilters } from '@/features/admin-dashboard/types/dashboard.types';

/**
 * Stable key for date/geo (and optional extras) so list widgets can reset
 * offset + accumulated rows as soon as query args change.
 */
export function buildDashboardListFilterKey(
  fromDate: string,
  toDate: string,
  geography: DashboardGeographyFilters,
  ...extras: Array<string | number | boolean | null | undefined>
): string {
  return [
    fromDate,
    toDate,
    geography.divisionId,
    geography.districtId,
    geography.upazilaId,
    ...extras.map((value) => (value == null ? '' : String(value))),
  ].join('|');
}

/**
 * Keeps infinite-scroll offset at 0 whenever `filterKey` changes (render-time),
 * matching Module Library / module-demand tab switches.
 */
export function useFilterKeyedOffset(
  filterKey: string,
): [number, Dispatch<SetStateAction<number>>] {
  const [offset, setOffset] = useState(0);
  const [activeFilterKey, setActiveFilterKey] = useState(filterKey);

  if (activeFilterKey !== filterKey) {
    setActiveFilterKey(filterKey);
    setOffset(0);
  }

  return [offset, setOffset];
}

interface UseAccumulatedFilterPagesOptions<TItem> {
  filterKey: string;
  queryOffset: number;
  /** Prefer RTK `currentData` items so previous-args rows never seed the list. */
  pageItems: TItem[] | undefined;
  getItemId: (item: TItem) => string;
}

/**
 * Accumulates paginated list pages and clears immediately when `filterKey`
 * changes so filter/tab switches do not flash stale rows.
 */
export function useAccumulatedFilterPages<TItem>({
  filterKey,
  queryOffset,
  pageItems,
  getItemId,
}: UseAccumulatedFilterPagesOptions<TItem>): TItem[] {
  const [accumulatedItems, setAccumulatedItems] = useState<TItem[]>([]);
  const [activeFilterKey, setActiveFilterKey] = useState(filterKey);
  const previousQueryOffset = useRef(queryOffset);

  if (activeFilterKey !== filterKey) {
    setActiveFilterKey(filterKey);
    previousQueryOffset.current = 0;
    setAccumulatedItems(
      pageItems != null && queryOffset === 0 ? pageItems : [],
    );
  }

  useEffect(() => {
    if (previousQueryOffset.current !== 0 && queryOffset === 0) {
      setAccumulatedItems([]);
    }
    previousQueryOffset.current = queryOffset;
  }, [queryOffset]);

  useEffect(() => {
    if (!pageItems) return;

    setAccumulatedItems((prev) => {
      if (queryOffset === 0) {
        // Prefer object identity so same-id rows still replace updated fields.
        if (
          prev.length === pageItems.length &&
          prev.every((item, idx) => item === pageItems[idx])
        ) {
          return prev;
        }
        return pageItems;
      }
      const existingIds = new Set(prev.map(getItemId));
      const newItems = pageItems.filter(
        (item) => !existingIds.has(getItemId(item)),
      );
      if (newItems.length === 0) return prev;
      return [...prev, ...newItems];
    });
  }, [getItemId, pageItems, queryOffset]);

  return accumulatedItems;
}
