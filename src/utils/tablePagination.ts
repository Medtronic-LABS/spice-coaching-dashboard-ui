/** Shared rows-per-page choices for numbered table pagination. */
export const TABLE_PAGE_SIZE_OPTIONS = [5, 10, 15, 25, 50] as const;

export const DEFAULT_TABLE_PAGE_SIZE = 10;

/** 0-based page index → API offset. */
export function tablePageOffset(page: number, pageSize: number): number {
  return page * pageSize;
}

/** 1-based inclusive row range for the current page. */
export function tablePaginationRange(
  page: number,
  pageSize: number,
  rowCount: number,
): { start: number; end: number } {
  if (rowCount <= 0) {
    return { start: 0, end: 0 };
  }
  const start = page * pageSize + 1;
  const end = page * pageSize + rowCount;
  return { start, end };
}

export function tableHasPrevPage(page: number): boolean {
  return page > 0;
}

export function tableHasNextPage(page: number, totalPages: number): boolean {
  return totalPages > 0 && page + 1 < totalPages;
}
