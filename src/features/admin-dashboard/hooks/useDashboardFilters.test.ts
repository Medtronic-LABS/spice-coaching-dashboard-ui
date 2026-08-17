import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useDashboardFilters } from '@/features/admin-dashboard/hooks/useDashboardFilters';
import { todayDateInputValue } from '@/utils/dateInput';

describe('useDashboardFilters', () => {
  it('keeps the last valid query range when custom dates become invalid', () => {
    const { result } = renderHook(() => useDashboardFilters());
    const initialRange = result.current.queryDateRange;

    act(() => {
      result.current.setDurationPreset('custom');
    });
    const seededRange = result.current.queryDateRange;
    expect(result.current.isDateRangeValid).toBe(true);
    expect(seededRange.fromDate).toBe(initialRange.fromDate);
    expect(seededRange.toDate).toBe(initialRange.toDate);

    act(() => {
      result.current.setCustomTo('');
    });

    expect(result.current.isDateRangeValid).toBe(false);
    expect(result.current.dateRange).toEqual({
      fromDate: seededRange.fromDate,
      toDate: '',
    });
    expect(result.current.queryDateRange).toEqual(seededRange);
  });

  it('clamps custom dates after today so the dashboard stays valid', () => {
    const { result } = renderHook(() => useDashboardFilters());

    act(() => {
      result.current.setDurationPreset('custom');
    });
    act(() => {
      result.current.setCustomTo('2099-01-01');
    });

    expect(result.current.filters.customTo).toBe(todayDateInputValue());
    expect(result.current.isDateRangeValid).toBe(true);
  });
});
