import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  dashboardGeographyFromDraft,
  EMPTY_DASHBOARD_GEOGRAPHY,
  geographyIdsFromDashboard,
  useDashboardFilters,
} from '@/features/admin-dashboard/hooks/useDashboardFilters';
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

describe('dashboard geography mapping', () => {
  it('keeps applied display names when the live label is still the id', () => {
    const previous = {
      ...EMPTY_DASHBOARD_GEOGRAPHY,
      divisionId: '1',
      division: 'Rangpur',
    };

    expect(
      dashboardGeographyFromDraft(
        { divisionId: '1', districtId: '', upazilaId: '' },
        { division: '1', district: '', upazila: '' },
        previous,
      ),
    ).toEqual({
      ...EMPTY_DASHBOARD_GEOGRAPHY,
      divisionId: '1',
      division: 'Rangpur',
    });
  });

  it('prefers the live geography label after a new selection', () => {
    expect(
      dashboardGeographyFromDraft(
        { divisionId: '2', districtId: '', upazilaId: '' },
        { division: 'Rajshahi', district: '', upazila: '' },
        {
          ...EMPTY_DASHBOARD_GEOGRAPHY,
          divisionId: '1',
          division: 'Rangpur',
        },
      ),
    ).toEqual({
      ...EMPTY_DASHBOARD_GEOGRAPHY,
      divisionId: '2',
      division: 'Rajshahi',
    });
  });

  it('extracts combobox ids from dashboard geography', () => {
    expect(
      geographyIdsFromDashboard({
        ...EMPTY_DASHBOARD_GEOGRAPHY,
        divisionId: '1',
        districtId: '10',
        division: 'Rangpur',
        district: 'Lalmonirhat',
      }),
    ).toEqual({
      divisionId: '1',
      districtId: '10',
      upazilaId: '',
    });
  });
});
