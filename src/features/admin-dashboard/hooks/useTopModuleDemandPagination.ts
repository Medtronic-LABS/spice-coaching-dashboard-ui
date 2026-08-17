import { useEffect, useRef, useState } from 'react';
import type { DashboardGeographyFilters } from '@/features/admin-dashboard/types/dashboard.types';

export function buildModuleDemandFilterKey(
  fromDate: string,
  toDate: string,
  geography: DashboardGeographyFilters,
): string {
  return `${fromDate}|${toDate}|${geography.division}|${geography.district}|${geography.upazila}`;
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
  const previousQueryOffset = useRef(queryOffset);

  useEffect(() => {
    setAccumulatedItems([]);
  }, [filterKey]);

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
