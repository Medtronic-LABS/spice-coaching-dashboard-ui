import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TABLE_PAGE_SIZE,
  TABLE_PAGE_SIZE_OPTIONS,
  tableHasNextPage,
  tableHasPrevPage,
  tablePageOffset,
  tablePaginationRange,
} from '@/utils/tablePagination';

describe('tablePagination', () => {
  it('uses a shared page-size menu and default', () => {
    expect(TABLE_PAGE_SIZE_OPTIONS).toEqual([5, 10, 15, 25, 50]);
    expect(DEFAULT_TABLE_PAGE_SIZE).toBe(10);
  });

  it('maps 0-based page state to API offset', () => {
    expect(tablePageOffset(0, 10)).toBe(0);
    expect(tablePageOffset(2, 25)).toBe(50);
  });

  it('computes 1-based inclusive row ranges', () => {
    expect(tablePaginationRange(0, 10, 0)).toEqual({ start: 0, end: 0 });
    expect(tablePaginationRange(1, 10, 4)).toEqual({ start: 11, end: 14 });
  });

  it('derives prev/next from 0-based page and total pages', () => {
    expect(tableHasPrevPage(0)).toBe(false);
    expect(tableHasPrevPage(1)).toBe(true);
    expect(tableHasNextPage(0, 0)).toBe(false);
    expect(tableHasNextPage(0, 3)).toBe(true);
    expect(tableHasNextPage(2, 3)).toBe(false);
  });
});
