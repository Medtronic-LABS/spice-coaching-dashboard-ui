import { useCallback, useEffect, useState } from 'react';
import { nextBoundedPageInput } from '@/utils/digitLimitedInteger';

/**
 * Shared page + page-input state for TablePagination consumers.
 * `page` is 0-based; `pageInput` is 1-based display text.
 * Pass live `totalPages` each render so commit/clamp stay correct after data loads.
 *
 * Offset/range/next/prev helpers: `@/utils/tablePagination`.
 */
export function useTablePageInput(totalPages: number) {
  const [page, setPage] = useState(0);
  const [pageInput, setPageInput] = useState('1');

  useEffect(() => {
    setPageInput(String(page + 1));
  }, [page]);

  useEffect(() => {
    if (totalPages > 0 && page >= totalPages) {
      setPage(totalPages - 1);
    }
  }, [page, totalPages]);

  const resetPage = useCallback(() => {
    setPage(0);
    setPageInput('1');
  }, []);

  const commitPageInput = useCallback(() => {
    const parsed = Number.parseInt(pageInput, 10);
    const isValid =
      Number.isFinite(parsed) &&
      parsed >= 1 &&
      (totalPages === 0 || parsed <= totalPages);
    if (!isValid) {
      setPageInput(String(page + 1));
      return;
    }
    setPage(parsed - 1);
  }, [page, pageInput, totalPages]);

  const handlePageInputChange = useCallback(
    (raw: string) => {
      const next = nextBoundedPageInput(raw, totalPages);
      if (next === null) return;
      setPageInput(next);
    },
    [totalPages],
  );

  return {
    page,
    setPage,
    pageInput,
    resetPage,
    commitPageInput,
    handlePageInputChange,
  };
}
