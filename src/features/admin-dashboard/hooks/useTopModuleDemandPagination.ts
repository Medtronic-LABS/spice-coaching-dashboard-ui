import { useEffect, useRef, useState } from 'react';
import type { DashboardGeographyFilters } from '@/features/admin-dashboard/types/dashboard.types';

export function buildModuleDemandFilterKey(
  fromDate: string,
  toDate: string,
  geography: DashboardGeographyFilters,
  view?: string,
): string {
  return `${fromDate}|${toDate}|${geography.divisionId}|${geography.districtId}|${geography.upazilaId}|${view ?? ''}`;
}

interface ModuleDemandPageSlice<TItem> {
  from_date: string;
  to_date: string;
  offset: number;
  items: TItem[];
}

interface UseAccumulatedModuleDemandPagesOptions<TItem> {
  filterKey: string;
  fromDate: string;
  toDate: string;
  queryOffset: number;
  pageData: ModuleDemandPageSlice<TItem> | undefined;
  getItemId: (item: TItem) => string;
  fulfilledTimeStamp?: number;
}

/**
 * Accumulates paginated module-demand pages.
 * Clears immediately (render-time) when `filterKey` changes so PO/SK (and
 * date/geo) switches do not flash the previous view’s rows.
 */
export function useAccumulatedModuleDemandPages<TItem>({
  filterKey,
  fromDate,
  toDate,
  queryOffset,
  pageData,
  getItemId,
  fulfilledTimeStamp,
}: UseAccumulatedModuleDemandPagesOptions<TItem>): TItem[] {
  const [accumulatedItems, setAccumulatedItems] = useState<TItem[]>([]);
  const [activeFilterKey, setActiveFilterKey] = useState(filterKey);
  const previousQueryOffset = useRef(queryOffset);

  if (activeFilterKey !== filterKey) {
    setActiveFilterKey(filterKey);
    previousQueryOffset.current = 0;
    const pageMatchesRange =
      pageData != null &&
      pageData.offset === 0 &&
      pageData.from_date === fromDate &&
      pageData.to_date === toDate;
    setAccumulatedItems(pageMatchesRange ? pageData.items : []);
  }

  useEffect(() => {
    if (previousQueryOffset.current !== 0 && queryOffset === 0) {
      setAccumulatedItems([]);
    }
    previousQueryOffset.current = queryOffset;
  }, [queryOffset]);

  useEffect(() => {
    if (!pageData) return;
    if (pageData.from_date !== fromDate || pageData.to_date !== toDate) return;

    setAccumulatedItems((prev) => {
      if (pageData.offset === 0) {
        return pageData.items;
      }
      const existingIds = new Set(prev.map(getItemId));
      return [
        ...prev,
        ...pageData.items.filter((item) => !existingIds.has(getItemId(item))),
      ];
    });
  }, [fromDate, getItemId, pageData, toDate, fulfilledTimeStamp]);

  return accumulatedItems;
}
