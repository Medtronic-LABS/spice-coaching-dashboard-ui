import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EMPTY_DASHBOARD_GEOGRAPHY } from '@/features/admin-dashboard/hooks/useDashboardFilters';
import { useDashboardGeographyComboboxes } from '@/features/admin-dashboard/hooks/useDashboardGeographyComboboxes';
import type { DashboardGeographyFilters } from '@/features/admin-dashboard/types/dashboard.types';
import { ASSIGNMENT_SEARCH_DEBOUNCE_MS } from '@/features/modules/utils/assignmentDialogHelpers';

const geographyMocks = vi.hoisted(() => {
  const divisions = [
    { id: 1, name: 'Dhaka' },
    { id: 2, name: 'Rangpur' },
    { id: 3, name: 'Chattogram' },
    { id: 4, name: 'Khulna' },
    { id: 5, name: 'Barishal' },
  ];
  const districts = [
    { id: 10, name: 'Gazipur', division_id: 1 },
    { id: 11, name: 'Kishoreganj', division_id: 1 },
    { id: 20, name: 'Lalmonirhat', division_id: 2 },
  ];
  const upazilas = [
    { id: 100, name: 'Kaliakoir', district_id: 10 },
    { id: 110, name: 'Bhairab', district_id: 11 },
    { id: 200, name: 'Hatibandha', district_id: 20 },
  ];

  function createPageTrigger<T extends { id: number; name: string }>(
    key: 'divisions' | 'districts' | 'upazilas',
    items: T[],
    filter?: (item: T, args: Record<string, unknown>) => boolean,
  ) {
    return vi.fn((args: Record<string, unknown> = {}) => {
      const offset = typeof args.offset === 'number' ? args.offset : 0;
      const limit = typeof args.limit === 'number' ? args.limit : 200;
      const filtered = filter
        ? items.filter((item) => filter(item, args))
        : items;
      const pageItems = filtered.slice(offset, offset + limit);
      return Promise.resolve({
        data: {
          [key]: pageItems,
          total: filtered.length,
          offset,
          limit,
        },
      });
    });
  }

  const triggerDivisionsPage = createPageTrigger('divisions', divisions);
  const triggerDistrictsPage = createPageTrigger(
    'districts',
    districts,
    (district, args) => {
      if (typeof args.divisionId === 'number') {
        return district.division_id === args.divisionId;
      }
      return true;
    },
  );
  const triggerUpazilasPage = createPageTrigger(
    'upazilas',
    upazilas,
    (upazila, args) => {
      if (typeof args.districtId === 'number') {
        return upazila.district_id === args.districtId;
      }
      return true;
    },
  );

  const paginatedDivisionsTrigger = vi.fn(
    (args: Record<string, unknown> = {}) => {
      const offset = typeof args.offset === 'number' ? args.offset : 0;
      const pageSize = 2;
      const pageItems = divisions.slice(offset, offset + pageSize);
      return Promise.resolve({
        data: {
          divisions: pageItems,
          total: divisions.length,
          offset,
          limit: pageSize,
        },
      });
    },
  );

  const failingLoadMoreDivisionsTrigger = vi.fn(
    (args: Record<string, unknown> = {}) => {
      const offset = typeof args.offset === 'number' ? args.offset : 0;
      const pageSize = 2;
      if (offset === 0) {
        return Promise.resolve({
          data: {
            divisions: divisions.slice(0, pageSize),
            total: divisions.length,
            offset,
            limit: pageSize,
          },
        });
      }
      return Promise.resolve({ error: { status: 500, data: 'fail' } });
    },
  );

  return {
    divisions,
    districts,
    upazilas,
    createPageTrigger,
    triggerDivisionsPage,
    triggerDistrictsPage,
    triggerUpazilasPage,
    paginatedDivisionsTrigger,
    failingLoadMoreDivisionsTrigger,
  };
});

const {
  divisions: MOCK_DIVISIONS,
  createPageTrigger,
  triggerDivisionsPage,
  triggerDistrictsPage,
  triggerUpazilasPage,
  paginatedDivisionsTrigger,
  failingLoadMoreDivisionsTrigger,
} = geographyMocks;

const mockApiState = vi.hoisted(() => ({
  divisionsError: false,
  districtsError: false,
  upazilasError: false,
}));

vi.mock('@/features/modules/api/adminAssignmentApi', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('@/features/modules/api/adminAssignmentApi')
    >();
  return {
    ...actual,
    useLazyFetchAdminDivisionsPageQuery: () => [
      triggerDivisionsPage,
      {
        get isLoading() {
          return false;
        },
        get isError() {
          return mockApiState.divisionsError;
        },
        get isFetching() {
          return false;
        },
      },
    ],
    useLazyFetchAdminDistrictsPageQuery: () => [
      triggerDistrictsPage,
      {
        isLoading: false,
        get isError() {
          return mockApiState.districtsError;
        },
        isFetching: false,
      },
    ],
    useLazyFetchAdminUpazilasPageQuery: () => [
      triggerUpazilasPage,
      {
        isLoading: false,
        get isError() {
          return mockApiState.upazilasError;
        },
        isFetching: false,
      },
    ],
  };
});

const LABELS = {
  allDivisions: 'All divisions',
  allDistricts: 'All districts',
  allUpazilas: 'All upazilas',
};

function renderGeographyComboboxes(
  overrides: Partial<{
    enabled: boolean;
    geography: DashboardGeographyFilters;
    onGeographyPatch: (patch: Partial<DashboardGeographyFilters>) => void;
  }> = {},
) {
  const onGeographyPatch =
    overrides.onGeographyPatch ??
    vi.fn<(patch: Partial<DashboardGeographyFilters>) => void>();

  const hook = renderHook(
    (props: { enabled: boolean; geography: DashboardGeographyFilters }) =>
      useDashboardGeographyComboboxes({
        enabled: props.enabled,
        geography: props.geography,
        onGeographyPatch,
        labels: LABELS,
      }),
    {
      initialProps: {
        enabled: overrides.enabled ?? true,
        geography: overrides.geography ?? EMPTY_DASHBOARD_GEOGRAPHY,
      },
    },
  );

  return { ...hook, onGeographyPatch };
}

describe('useDashboardGeographyComboboxes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiState.divisionsError = false;
    mockApiState.districtsError = false;
    mockApiState.upazilasError = false;
    triggerDivisionsPage.mockImplementation(
      createPageTrigger('divisions', MOCK_DIVISIONS),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('loads division, district, and upazila catalogs when enabled', async () => {
    const { result } = renderGeographyComboboxes();

    await waitFor(() => {
      expect(
        result.current.division.options.some(
          (option) => option.label === 'Dhaka',
        ),
      ).toBe(true);
    });

    expect(triggerDivisionsPage).toHaveBeenCalled();
    expect(triggerDistrictsPage).toHaveBeenCalled();
    expect(triggerUpazilasPage).toHaveBeenCalled();
    expect(
      result.current.district.options.some(
        (option) => option.label === 'Gazipur',
      ),
    ).toBe(true);
    expect(
      result.current.upazila.options.some(
        (option) => option.label === 'Kaliakoir',
      ),
    ).toBe(true);
  });

  it('does not fetch catalogs when disabled', async () => {
    renderGeographyComboboxes({ enabled: false });

    await act(async () => {
      await Promise.resolve();
    });

    expect(triggerDivisionsPage).not.toHaveBeenCalled();
    expect(triggerDistrictsPage).not.toHaveBeenCalled();
    expect(triggerUpazilasPage).not.toHaveBeenCalled();
  });

  it('resets district and upazila catalogs when the division changes', async () => {
    const { result, onGeographyPatch, rerender } = renderGeographyComboboxes();

    await waitFor(() => {
      expect(
        result.current.division.options.some(
          (option) => option.label === 'Dhaka',
        ),
      ).toBe(true);
    });

    triggerDistrictsPage.mockClear();
    triggerUpazilasPage.mockClear();

    act(() => {
      result.current.division.onChange('1');
    });

    rerender({
      enabled: true,
      geography: { ...EMPTY_DASHBOARD_GEOGRAPHY, divisionId: '1' },
    });

    expect(onGeographyPatch).toHaveBeenCalledWith({ divisionId: '1' });

    await waitFor(() => {
      expect(triggerDistrictsPage).toHaveBeenCalledWith(
        expect.objectContaining({ divisionId: 1, offset: 0 }),
      );
      expect(triggerUpazilasPage).toHaveBeenCalledWith(
        expect.objectContaining({ offset: 0 }),
      );
    });
  });

  it('resets upazila catalog when the district changes', async () => {
    const { result, onGeographyPatch, rerender } = renderGeographyComboboxes();

    await waitFor(() => {
      expect(
        result.current.district.options.some(
          (option) => option.label === 'Gazipur',
        ),
      ).toBe(true);
    });

    triggerUpazilasPage.mockClear();

    act(() => {
      result.current.district.onChange('10');
    });

    rerender({
      enabled: true,
      geography: { ...EMPTY_DASHBOARD_GEOGRAPHY, districtId: '10' },
    });

    expect(onGeographyPatch).toHaveBeenCalledWith({ districtId: '10' });

    await waitFor(() => {
      expect(triggerUpazilasPage).toHaveBeenCalledWith(
        expect.objectContaining({ districtId: 10, offset: 0 }),
      );
    });
  });

  it('debounces division search and sends q to the API', async () => {
    vi.useFakeTimers();
    const { result } = renderGeographyComboboxes();

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    triggerDivisionsPage.mockClear();

    act(() => {
      result.current.division.onSearchTermChange('dha');
    });

    act(() => {
      vi.advanceTimersByTime(ASSIGNMENT_SEARCH_DEBOUNCE_MS - 1);
    });
    expect(triggerDivisionsPage).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1);
      await Promise.resolve();
    });

    expect(triggerDivisionsPage).toHaveBeenCalledWith(
      expect.objectContaining({ q: 'dha', offset: 0 }),
    );
  });

  it('appends the next page when onLoadMore is called', async () => {
    triggerDivisionsPage.mockImplementation(paginatedDivisionsTrigger);

    const { result } = renderGeographyComboboxes();

    await waitFor(() => {
      expect(result.current.division.hasMore).toBe(true);
      expect(
        result.current.division.options.filter((option) => option.value !== ''),
      ).toHaveLength(2);
    });

    await act(async () => {
      result.current.division.onLoadMore();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(
        result.current.division.options.some(
          (option) => option.label === 'Chattogram',
        ),
      ).toBe(true);
      expect(paginatedDivisionsTrigger).toHaveBeenCalledWith(
        expect.objectContaining({ offset: 2 }),
      );
    });
  });

  it('shows a failure message when the initial division catalog request errors', async () => {
    triggerDivisionsPage.mockImplementation(() =>
      Promise.resolve({ error: { status: 500, data: 'fail' } }),
    );
    mockApiState.divisionsError = true;

    const { result } = renderGeographyComboboxes();

    await waitFor(() => {
      expect(result.current.division.emptyMessage).toBe(
        'Failed to load divisions.',
      );
    });
  });

  it('retries division catalog load after a failed append', async () => {
    triggerDivisionsPage.mockImplementation(failingLoadMoreDivisionsTrigger);

    const { result } = renderGeographyComboboxes();

    await waitFor(() => {
      expect(result.current.division.hasMore).toBe(true);
    });

    const loadedOptionCount = result.current.division.options.filter(
      (option) => option.value !== '',
    ).length;

    await act(async () => {
      result.current.division.onLoadMore();
      await Promise.resolve();
    });

    expect(
      result.current.division.options.filter((option) => option.value !== ''),
    ).toHaveLength(loadedOptionCount);
    expect(failingLoadMoreDivisionsTrigger).toHaveBeenCalledWith(
      expect.objectContaining({ offset: 2 }),
    );

    triggerDivisionsPage.mockImplementation(paginatedDivisionsTrigger);

    await act(async () => {
      result.current.division.onLoadMoreRetry();
      await Promise.resolve();
    });

    expect(paginatedDivisionsTrigger).toHaveBeenCalledWith(
      expect.objectContaining({ offset: 0 }),
    );
  });

  it('filters district requests by the selected division', async () => {
    const { result, rerender } = renderGeographyComboboxes({
      geography: { ...EMPTY_DASHBOARD_GEOGRAPHY, divisionId: '1' },
    });

    await waitFor(() => {
      expect(triggerDistrictsPage).toHaveBeenCalledWith(
        expect.objectContaining({ divisionId: 1 }),
      );
    });

    rerender({
      enabled: true,
      geography: { ...EMPTY_DASHBOARD_GEOGRAPHY, divisionId: '2' },
    });

    await waitFor(() => {
      expect(triggerDistrictsPage).toHaveBeenCalledWith(
        expect.objectContaining({ divisionId: 2 }),
      );
    });

    expect(
      result.current.district.options.some(
        (option) => option.label === 'Lalmonirhat',
      ),
    ).toBe(true);
    expect(
      result.current.district.options.some(
        (option) => option.label === 'Gazipur',
      ),
    ).toBe(false);
  });
});
