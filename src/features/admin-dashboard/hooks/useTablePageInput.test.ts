import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useTablePageInput } from '@/features/admin-dashboard/hooks/useTablePageInput';

describe('useTablePageInput', () => {
  it('commits a valid 1-based page input', () => {
    const { result } = renderHook(() => useTablePageInput(5));

    act(() => {
      result.current.handlePageInputChange('3');
    });
    act(() => {
      result.current.commitPageInput();
    });

    expect(result.current.page).toBe(2);
    expect(result.current.pageInput).toBe('3');
  });

  it('rejects invalid input and restores the current page', () => {
    const { result } = renderHook(() => useTablePageInput(5));

    act(() => {
      result.current.setPage(1);
    });
    act(() => {
      result.current.handlePageInputChange('99');
    });
    expect(result.current.pageInput).toBe('2');

    act(() => {
      result.current.handlePageInputChange('abc');
    });
    expect(result.current.pageInput).toBe('2');

    act(() => {
      result.current.handlePageInputChange('0');
    });
    expect(result.current.pageInput).toBe('2');
  });

  it('clamps page when totalPages shrinks', () => {
    const { result, rerender } = renderHook(
      ({ totalPages }) => useTablePageInput(totalPages),
      { initialProps: { totalPages: 5 } },
    );

    act(() => {
      result.current.setPage(4);
    });
    expect(result.current.page).toBe(4);

    rerender({ totalPages: 2 });
    expect(result.current.page).toBe(1);
  });

  it('resets to the first page', () => {
    const { result } = renderHook(() => useTablePageInput(4));

    act(() => {
      result.current.setPage(2);
    });
    act(() => {
      result.current.resetPage();
    });

    expect(result.current.page).toBe(0);
    expect(result.current.pageInput).toBe('1');
  });
});
