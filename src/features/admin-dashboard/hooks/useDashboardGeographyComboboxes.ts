import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComboboxOption } from '@/components/ui';
import type { DashboardGeographyFilters } from '@/features/admin-dashboard/types/dashboard.types';
import {
  ASSIGNMENT_LIST_PAGE_SIZE,
  useLazyFetchAdminDistrictsPageQuery,
  useLazyFetchAdminDivisionsPageQuery,
  useLazyFetchAdminUpazilasPageQuery,
  type AdminDistrict,
  type AdminDivision,
  type AdminUpazila,
} from '@/features/modules/api/adminAssignmentApi';
import {
  ASSIGNMENT_SEARCH_DEBOUNCE_MS,
  buildNamedEntityComboboxOptions,
  resolveNamedEntitySelection,
} from '@/features/modules/utils/assignmentDialogHelpers';
import { parseGeographyId } from '@/features/modules/utils/geographyFilters';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

export interface DashboardGeographyComboboxBindings {
  value: string;
  selectedLabel: string;
  options: ComboboxOption[];
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  onChange: (value: string) => void;
  isLoading: boolean;
  hint?: string;
  emptyMessage: string;
  placeholder: string;
  hasMore: boolean;
  onLoadMore: () => void;
  isLoadingMore: boolean;
  loadMoreError: boolean;
  onLoadMoreRetry: () => void;
}

interface GeographyLabels {
  allDivisions: string;
  allDistricts: string;
  allUpazilas: string;
}

function cacheEntityLabel(
  cache: Map<string, string>,
  level: 'division' | 'district' | 'upazila',
  id: number,
  name: string,
): void {
  if (!name) return;
  cache.set(`${level}:${id}`, name);
}

function readCachedLabel(
  cache: Map<string, string>,
  level: 'division' | 'district' | 'upazila',
  id: string,
): string {
  return cache.get(`${level}:${id}`) ?? '';
}

export function useDashboardGeographyComboboxes(args: {
  enabled: boolean;
  geography: DashboardGeographyFilters;
  onGeographyPatch: (patch: Partial<DashboardGeographyFilters>) => void;
  labels: GeographyLabels;
}) {
  const { enabled, geography, onGeographyPatch, labels } = args;

  const selectedDivisionId = parseGeographyId(geography.divisionId);
  const selectedDistrictId = parseGeographyId(geography.districtId);
  const selectedUpazilaId = parseGeographyId(geography.upazilaId);

  const labelCacheRef = useRef<Map<string, string>>(new Map());

  const [divisionSearch, setDivisionSearch] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');
  const [upazilaSearch, setUpazilaSearch] = useState('');
  const debouncedDivisionSearch = useDebouncedValue(
    divisionSearch,
    ASSIGNMENT_SEARCH_DEBOUNCE_MS,
  );
  const debouncedDistrictSearch = useDebouncedValue(
    districtSearch,
    ASSIGNMENT_SEARCH_DEBOUNCE_MS,
  );
  const debouncedUpazilaSearch = useDebouncedValue(
    upazilaSearch,
    ASSIGNMENT_SEARCH_DEBOUNCE_MS,
  );

  const [loadedDivisions, setLoadedDivisions] = useState<AdminDivision[]>([]);
  const [divisionsTotal, setDivisionsTotal] = useState(0);
  const [divisionsOffset, setDivisionsOffset] = useState(0);
  const [divisionsCatalogPending, setDivisionsCatalogPending] = useState(false);

  const [loadedDistricts, setLoadedDistricts] = useState<AdminDistrict[]>([]);
  const [districtsTotal, setDistrictsTotal] = useState(0);
  const [districtsOffset, setDistrictsOffset] = useState(0);
  const [districtsCatalogPending, setDistrictsCatalogPending] = useState(false);

  const [loadedUpazilas, setLoadedUpazilas] = useState<AdminUpazila[]>([]);
  const [upazilasTotal, setUpazilasTotal] = useState(0);
  const [upazilasOffset, setUpazilasOffset] = useState(0);
  const [upazilasCatalogPending, setUpazilasCatalogPending] = useState(false);

  const divisionsRequestSeqRef = useRef(0);
  const districtsRequestSeqRef = useRef(0);
  const upazilasRequestSeqRef = useRef(0);

  const [
    triggerDivisionsPage,
    {
      isLoading: loadingDivisions,
      isError: divisionsError,
      isFetching: fetchingDivisions,
    },
  ] = useLazyFetchAdminDivisionsPageQuery();

  const [
    triggerDistrictsPage,
    {
      isLoading: loadingDistricts,
      isError: districtsError,
      isFetching: fetchingDistricts,
    },
  ] = useLazyFetchAdminDistrictsPageQuery();

  const [
    triggerUpazilasPage,
    {
      isLoading: loadingUpazilas,
      isError: upazilasError,
      isFetching: fetchingUpazilas,
    },
  ] = useLazyFetchAdminUpazilasPageQuery();

  useEffect(() => {
    if (enabled) return;
    setDivisionSearch('');
    setDistrictSearch('');
    setUpazilaSearch('');
  }, [enabled]);

  const loadDivisionsPage = useCallback(
    async (offset: number, append: boolean) => {
      const requestSeq = append
        ? divisionsRequestSeqRef.current
        : ++divisionsRequestSeqRef.current;
      if (!append) {
        setDivisionsCatalogPending(true);
      }
      try {
        const nameQuery = debouncedDivisionSearch.trim();
        const result = await triggerDivisionsPage({
          limit: ASSIGNMENT_LIST_PAGE_SIZE,
          offset,
          ...(nameQuery ? { q: nameQuery } : {}),
        });
        if (requestSeq !== divisionsRequestSeqRef.current) return;
        if ('error' in result && result.error) return;
        const page = result.data;
        if (!page) return;
        for (const division of page.divisions) {
          cacheEntityLabel(
            labelCacheRef.current,
            'division',
            division.id,
            division.name,
          );
        }
        setDivisionsTotal(page.total);
        setDivisionsOffset(page.offset + page.divisions.length);
        setLoadedDivisions((prev) => {
          const merged = append ? [...prev, ...page.divisions] : page.divisions;
          const seen = new Set<number>();
          return merged.filter((division) => {
            if (seen.has(division.id)) return false;
            seen.add(division.id);
            return true;
          });
        });
      } finally {
        if (!append && requestSeq === divisionsRequestSeqRef.current) {
          setDivisionsCatalogPending(false);
        }
      }
    },
    [debouncedDivisionSearch, triggerDivisionsPage],
  );

  const loadDistrictsPage = useCallback(
    async (offset: number, append: boolean) => {
      const requestSeq = append
        ? districtsRequestSeqRef.current
        : ++districtsRequestSeqRef.current;
      if (!append) {
        setDistrictsCatalogPending(true);
      }
      try {
        const nameQuery = debouncedDistrictSearch.trim();
        const result = await triggerDistrictsPage({
          limit: ASSIGNMENT_LIST_PAGE_SIZE,
          offset,
          ...(selectedDivisionId !== undefined
            ? { divisionId: selectedDivisionId }
            : {}),
          ...(nameQuery ? { q: nameQuery } : {}),
        });
        if (requestSeq !== districtsRequestSeqRef.current) return;
        if ('error' in result && result.error) return;
        const page = result.data;
        if (!page) return;
        for (const district of page.districts) {
          cacheEntityLabel(
            labelCacheRef.current,
            'district',
            district.id,
            district.name,
          );
        }
        setDistrictsTotal(page.total);
        setDistrictsOffset(page.offset + page.districts.length);
        setLoadedDistricts((prev) => {
          const merged = append ? [...prev, ...page.districts] : page.districts;
          const seen = new Set<number>();
          return merged.filter((district) => {
            if (seen.has(district.id)) return false;
            seen.add(district.id);
            return true;
          });
        });
      } finally {
        if (!append && requestSeq === districtsRequestSeqRef.current) {
          setDistrictsCatalogPending(false);
        }
      }
    },
    [debouncedDistrictSearch, selectedDivisionId, triggerDistrictsPage],
  );

  const loadUpazilasPage = useCallback(
    async (offset: number, append: boolean) => {
      const requestSeq = append
        ? upazilasRequestSeqRef.current
        : ++upazilasRequestSeqRef.current;
      if (!append) {
        setUpazilasCatalogPending(true);
      }
      try {
        const nameQuery = debouncedUpazilaSearch.trim();
        const result = await triggerUpazilasPage({
          limit: ASSIGNMENT_LIST_PAGE_SIZE,
          offset,
          ...(selectedDistrictId !== undefined
            ? { districtId: selectedDistrictId }
            : {}),
          ...(nameQuery ? { q: nameQuery } : {}),
        });
        if (requestSeq !== upazilasRequestSeqRef.current) return;
        if ('error' in result && result.error) return;
        const page = result.data;
        if (!page) return;
        for (const upazila of page.upazilas) {
          cacheEntityLabel(
            labelCacheRef.current,
            'upazila',
            upazila.id,
            upazila.name,
          );
        }
        setUpazilasTotal(page.total);
        setUpazilasOffset(page.offset + page.upazilas.length);
        setLoadedUpazilas((prev) => {
          const merged = append ? [...prev, ...page.upazilas] : page.upazilas;
          const seen = new Set<number>();
          return merged.filter((upazila) => {
            if (seen.has(upazila.id)) return false;
            seen.add(upazila.id);
            return true;
          });
        });
      } finally {
        if (!append && requestSeq === upazilasRequestSeqRef.current) {
          setUpazilasCatalogPending(false);
        }
      }
    },
    // selectedDivisionId triggers a refetch after division cascade resets clear the catalog.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional cascade reload trigger
    [
      debouncedUpazilaSearch,
      selectedDistrictId,
      selectedDivisionId,
      triggerUpazilasPage,
    ],
  );

  const resetUpazilaCatalog = useCallback(() => {
    setUpazilasCatalogPending(true);
    setUpazilaSearch('');
    setLoadedUpazilas([]);
    setUpazilasTotal(0);
    setUpazilasOffset(0);
  }, []);

  const resetDistrictAndUpazilaCatalogs = useCallback(() => {
    setDistrictsCatalogPending(true);
    setDistrictSearch('');
    setLoadedDistricts([]);
    setDistrictsTotal(0);
    setDistrictsOffset(0);
    resetUpazilaCatalog();
  }, [resetUpazilaCatalog]);

  useEffect(() => {
    if (!enabled) return;
    void loadDivisionsPage(0, false);
  }, [enabled, loadDivisionsPage]);

  useEffect(() => {
    if (!enabled) return;
    void loadDistrictsPage(0, false);
  }, [enabled, loadDistrictsPage]);

  useEffect(() => {
    if (!enabled) return;
    void loadUpazilasPage(0, false);
  }, [enabled, loadUpazilasPage]);

  const visibleUpazilas = useMemo(() => {
    if (selectedDistrictId !== undefined) return loadedUpazilas;
    if (selectedDivisionId !== undefined) {
      const districtIds = new Set(
        loadedDistricts.map((district) => district.id),
      );
      return loadedUpazilas.filter((upazila) =>
        districtIds.has(upazila.district_id),
      );
    }
    return loadedUpazilas;
  }, [loadedDistricts, loadedUpazilas, selectedDistrictId, selectedDivisionId]);

  const divisionSelectedName =
    loadedDivisions.find((division) => division.id === selectedDivisionId)
      ?.name ??
    (geography.divisionId
      ? readCachedLabel(labelCacheRef.current, 'division', geography.divisionId)
      : '');

  const districtSelectedName =
    loadedDistricts.find((district) => district.id === selectedDistrictId)
      ?.name ??
    (geography.districtId
      ? readCachedLabel(labelCacheRef.current, 'district', geography.districtId)
      : '');

  const upazilaSelectedName =
    visibleUpazilas.find((upazila) => upazila.id === selectedUpazilaId)?.name ??
    loadedUpazilas.find((upazila) => upazila.id === selectedUpazilaId)?.name ??
    (geography.upazilaId
      ? readCachedLabel(labelCacheRef.current, 'upazila', geography.upazilaId)
      : '');

  const divisionOptions = useMemo(
    () =>
      buildNamedEntityComboboxOptions(
        { label: labels.allDivisions, value: '' },
        loadedDivisions,
        selectedDivisionId ?? null,
        divisionSelectedName,
      ),
    [
      divisionSelectedName,
      labels.allDivisions,
      loadedDivisions,
      selectedDivisionId,
    ],
  );

  const districtOptions = useMemo(
    () =>
      buildNamedEntityComboboxOptions(
        { label: labels.allDistricts, value: '' },
        loadedDistricts,
        selectedDistrictId ?? null,
        districtSelectedName,
      ),
    [
      districtSelectedName,
      labels.allDistricts,
      loadedDistricts,
      selectedDistrictId,
    ],
  );

  const upazilaOptions = useMemo(
    () =>
      buildNamedEntityComboboxOptions(
        { label: labels.allUpazilas, value: '' },
        visibleUpazilas,
        selectedUpazilaId ?? null,
        upazilaSelectedName,
      ),
    [
      labels.allUpazilas,
      selectedUpazilaId,
      upazilaSelectedName,
      visibleUpazilas,
    ],
  );

  const divisionsHasMore = loadedDivisions.length < divisionsTotal;
  const districtsHasMore = loadedDistricts.length < districtsTotal;
  const upazilasHasMore = loadedUpazilas.length < upazilasTotal;

  const retryDivisions = useCallback(() => {
    setDivisionsCatalogPending(true);
    setLoadedDivisions([]);
    setDivisionsOffset(0);
    void loadDivisionsPage(0, false);
  }, [loadDivisionsPage]);

  const retryDistricts = useCallback(() => {
    setDistrictsCatalogPending(true);
    setLoadedDistricts([]);
    setDistrictsOffset(0);
    void loadDistrictsPage(0, false);
  }, [loadDistrictsPage]);

  const retryUpazilas = useCallback(() => {
    setUpazilasCatalogPending(true);
    setLoadedUpazilas([]);
    setUpazilasOffset(0);
    void loadUpazilasPage(0, false);
  }, [loadUpazilasPage]);

  const handleDivisionChange = useCallback(
    (value: string) => {
      const next = resolveNamedEntitySelection(
        value,
        loadedDivisions,
        selectedDivisionId ?? null,
        divisionSelectedName,
      );
      if (next.name && next.id !== null) {
        cacheEntityLabel(labelCacheRef.current, 'division', next.id, next.name);
      }
      resetDistrictAndUpazilaCatalogs();
      onGeographyPatch({ divisionId: value });
    },
    [
      divisionSelectedName,
      loadedDivisions,
      onGeographyPatch,
      resetDistrictAndUpazilaCatalogs,
      selectedDivisionId,
    ],
  );

  const handleDistrictChange = useCallback(
    (value: string) => {
      const next = resolveNamedEntitySelection(
        value,
        loadedDistricts,
        selectedDistrictId ?? null,
        districtSelectedName,
      );
      if (next.name && next.id !== null) {
        cacheEntityLabel(labelCacheRef.current, 'district', next.id, next.name);
      }
      resetUpazilaCatalog();
      onGeographyPatch({ districtId: value });
    },
    [
      districtSelectedName,
      loadedDistricts,
      onGeographyPatch,
      resetUpazilaCatalog,
      selectedDistrictId,
    ],
  );

  const handleUpazilaChange = useCallback(
    (value: string) => {
      const next = resolveNamedEntitySelection(
        value,
        visibleUpazilas,
        selectedUpazilaId ?? null,
        upazilaSelectedName,
      );
      if (next.name && next.id !== null) {
        cacheEntityLabel(labelCacheRef.current, 'upazila', next.id, next.name);
      }
      onGeographyPatch({ upazilaId: value });
    },
    [onGeographyPatch, selectedUpazilaId, upazilaSelectedName, visibleUpazilas],
  );

  const divisionCatalogLoading =
    divisionsCatalogPending ||
    (loadingDivisions && loadedDivisions.length === 0);
  const districtCatalogLoading =
    districtsCatalogPending ||
    (loadingDistricts && loadedDistricts.length === 0);
  const upazilaCatalogLoading =
    upazilasCatalogPending ||
    (loadingUpazilas && loadedUpazilas.length === 0) ||
    (selectedDivisionId !== undefined &&
      selectedDistrictId === undefined &&
      (districtsCatalogPending ||
        (loadingDistricts && loadedDistricts.length === 0)));

  const division: DashboardGeographyComboboxBindings = {
    value: geography.divisionId,
    selectedLabel: geography.divisionId
      ? divisionSelectedName || geography.divisionId
      : labels.allDivisions,
    options: divisionOptions,
    searchTerm: divisionSearch,
    onSearchTermChange: setDivisionSearch,
    onChange: handleDivisionChange,
    isLoading: enabled && divisionCatalogLoading,
    hint:
      divisionsTotal > 0
        ? `Showing ${loadedDivisions.length} of ${divisionsTotal}`
        : undefined,
    emptyMessage: divisionsError
      ? 'Failed to load divisions.'
      : 'No divisions found.',
    placeholder: 'Type to search divisions…',
    hasMore: divisionsHasMore,
    onLoadMore: () => {
      void loadDivisionsPage(divisionsOffset, true);
    },
    isLoadingMore: fetchingDivisions && loadedDivisions.length > 0,
    loadMoreError: divisionsError && loadedDivisions.length > 0,
    onLoadMoreRetry: retryDivisions,
  };

  const district: DashboardGeographyComboboxBindings = {
    value: geography.districtId,
    selectedLabel: geography.districtId
      ? districtSelectedName || geography.districtId
      : labels.allDistricts,
    options: districtOptions,
    searchTerm: districtSearch,
    onSearchTermChange: setDistrictSearch,
    onChange: handleDistrictChange,
    isLoading: enabled && districtCatalogLoading,
    hint:
      districtsTotal > 0
        ? `Showing ${loadedDistricts.length} of ${districtsTotal}`
        : undefined,
    emptyMessage: districtsError
      ? 'Failed to load districts.'
      : 'No districts found.',
    placeholder: 'Type to search districts…',
    hasMore: districtsHasMore,
    onLoadMore: () => {
      void loadDistrictsPage(districtsOffset, true);
    },
    isLoadingMore: fetchingDistricts && loadedDistricts.length > 0,
    loadMoreError: districtsError && loadedDistricts.length > 0,
    onLoadMoreRetry: retryDistricts,
  };

  const upazila: DashboardGeographyComboboxBindings = {
    value: geography.upazilaId,
    selectedLabel: geography.upazilaId
      ? upazilaSelectedName || geography.upazilaId
      : labels.allUpazilas,
    options: upazilaOptions,
    searchTerm: upazilaSearch,
    onSearchTermChange: setUpazilaSearch,
    onChange: handleUpazilaChange,
    isLoading: enabled && upazilaCatalogLoading,
    hint:
      upazilasTotal > 0
        ? `Showing ${visibleUpazilas.length} of ${upazilasTotal}`
        : undefined,
    emptyMessage: upazilasError
      ? 'Failed to load upazilas.'
      : 'No upazilas found.',
    placeholder: 'Type to search upazilas…',
    hasMore: upazilasHasMore,
    onLoadMore: () => {
      void loadUpazilasPage(upazilasOffset, true);
    },
    isLoadingMore: fetchingUpazilas && loadedUpazilas.length > 0,
    loadMoreError: upazilasError && loadedUpazilas.length > 0,
    onLoadMoreRetry: retryUpazilas,
  };

  return { division, district, upazila };
}
