import { useCallback, useEffect, useMemo, useState } from 'react';

const DEFAULT_PAGE_SIZE = 20;

/**
 * Client-side windowing helper for infinite-scroll UIs over an in-memory list.
 * Resets the visible window whenever `resetKey` changes (filters, search, etc.).
 */
export function useWindowedList<T>(
  items: T[],
  options?: { pageSize?: number; resetKey?: string | number },
) {
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const resetKey = options?.resetKey;

  const [visibleCount, setVisibleCount] = useState(pageSize);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [pageSize, resetKey]);

  const visibleItems = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount],
  );

  const hasMore = visibleCount < items.length;

  const loadMore = useCallback(() => {
    setVisibleCount((count) => Math.min(count + pageSize, items.length));
  }, [items.length, pageSize]);

  return {
    visibleItems,
    visibleCount,
    hasMore,
    loadMore,
    totalCount: items.length,
  };
}
