import { useEffect, useMemo, useRef, useState } from 'react';
import {
  useFetchAdminDistrictsPageQuery,
  useFetchAdminDivisionsPageQuery,
  useFetchAdminUpazilasPageQuery,
} from '@/features/modules/api/adminAssignmentApi';
import {
  applyGeographyFilterChange,
  buildGeographyFilterSection,
  GEOGRAPHY_ALL_LABELS,
  geographyTruncationHint,
  parseGeographyId,
  prependGeographyAllOption,
  type GeographyComboboxBindings,
  type GeographyFilterState,
} from '@/features/modules/utils/geographyFilters';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

const GEOGRAPHY_SEARCH_DEBOUNCE_MS = 300;
const DIVISION_PAGE_SIZE = 200;
const DISTRICT_PAGE_SIZE = 200;
const UPAZILA_PAGE_SIZE = 50;

type GeographyLevel = 'division' | 'district' | 'upazila';

function geographyCacheKey(level: GeographyLevel, id: string | number): string {
  return `${level}:${id}`;
}

export function useGeographyFilterOptions(args: {
  enabled: boolean;
  idPrefix: string;
  selection: GeographyFilterState;
  onSelectionChange: (next: GeographyFilterState) => void;
}) {
  const { enabled, idPrefix, selection, onSelectionChange } = args;
  const [divisionSearch, setDivisionSearch] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');
  const [upazilaSearch, setUpazilaSearch] = useState('');
  const labelCacheRef = useRef<Map<string, string>>(new Map());

  const debouncedDivisionSearch = useDebouncedValue(
    divisionSearch,
    GEOGRAPHY_SEARCH_DEBOUNCE_MS,
  );
  const debouncedDistrictSearch = useDebouncedValue(
    districtSearch,
    GEOGRAPHY_SEARCH_DEBOUNCE_MS,
  );
  const debouncedUpazilaSearch = useDebouncedValue(
    upazilaSearch,
    GEOGRAPHY_SEARCH_DEBOUNCE_MS,
  );

  useEffect(() => {
    if (enabled) return;
    setDivisionSearch('');
    setDistrictSearch('');
    setUpazilaSearch('');
  }, [enabled]);

  const divisionId = parseGeographyId(selection.divisionId);
  const districtId = parseGeographyId(selection.districtId);

  const { data: divisionsPage, isFetching: divisionsLoading } =
    useFetchAdminDivisionsPageQuery(
      {
        limit: DIVISION_PAGE_SIZE,
        offset: 0,
        q: debouncedDivisionSearch.trim() || undefined,
      },
      { skip: !enabled },
    );
  const { data: districtsPage, isFetching: districtsLoading } =
    useFetchAdminDistrictsPageQuery(
      {
        limit: DISTRICT_PAGE_SIZE,
        offset: 0,
        q: debouncedDistrictSearch.trim() || undefined,
        ...(divisionId !== undefined ? { divisionId } : {}),
      },
      { skip: !enabled },
    );
  const { data: upazilasPage, isFetching: upazilasLoading } =
    useFetchAdminUpazilasPageQuery(
      {
        limit: UPAZILA_PAGE_SIZE,
        offset: 0,
        q: debouncedUpazilaSearch.trim() || undefined,
        ...(districtId !== undefined ? { districtId } : {}),
      },
      { skip: !enabled },
    );

  const divisions = useMemo(
    () => divisionsPage?.divisions ?? [],
    [divisionsPage?.divisions],
  );
  const districts = useMemo(
    () => districtsPage?.districts ?? [],
    [districtsPage?.districts],
  );
  const upazilas = useMemo(
    () => upazilasPage?.upazilas ?? [],
    [upazilasPage?.upazilas],
  );

  useEffect(() => {
    for (const division of divisions) {
      labelCacheRef.current.set(
        geographyCacheKey('division', division.id),
        division.name,
      );
    }
    for (const district of districts) {
      labelCacheRef.current.set(
        geographyCacheKey('district', district.id),
        district.name,
      );
    }
    for (const upazila of upazilas) {
      labelCacheRef.current.set(
        geographyCacheKey('upazila', upazila.id),
        upazila.name,
      );
    }
  }, [districts, divisions, upazilas]);

  const resolveLabel = (
    level: GeographyLevel,
    selectedId: string,
    items: Array<{ id: number; name: string }>,
    allLabel: string,
  ): string => {
    if (!selectedId) return allLabel;
    const fromPage = items.find((item) => String(item.id) === selectedId)?.name;
    return (
      fromPage ??
      labelCacheRef.current.get(geographyCacheKey(level, selectedId)) ??
      selectedId
    );
  };

  const divisionLabel = resolveLabel(
    'division',
    selection.divisionId,
    divisions,
    GEOGRAPHY_ALL_LABELS.division,
  );
  const districtLabel = resolveLabel(
    'district',
    selection.districtId,
    districts,
    GEOGRAPHY_ALL_LABELS.district,
  );
  const upazilaLabel = resolveLabel(
    'upazila',
    selection.upazilaId,
    upazilas,
    GEOGRAPHY_ALL_LABELS.upazila,
  );

  const divisionOptions = useMemo(
    () =>
      prependGeographyAllOption(
        GEOGRAPHY_ALL_LABELS.division,
        divisions,
        selection.divisionId,
        divisionLabel,
      ),
    [divisionLabel, divisions, selection.divisionId],
  );
  const districtOptions = useMemo(
    () =>
      prependGeographyAllOption(
        GEOGRAPHY_ALL_LABELS.district,
        districts,
        selection.districtId,
        districtLabel,
      ),
    [districtLabel, districts, selection.districtId],
  );
  const upazilaOptions = useMemo(
    () =>
      prependGeographyAllOption(
        GEOGRAPHY_ALL_LABELS.upazila,
        upazilas,
        selection.upazilaId,
        upazilaLabel,
      ),
    [selection.upazilaId, upazilaLabel, upazilas],
  );

  const division: GeographyComboboxBindings = {
    value: selection.divisionId,
    selectedLabel: divisionLabel,
    options: divisionOptions,
    searchTerm: divisionSearch,
    onSearchTermChange: setDivisionSearch,
    onChange: (divisionIdValue) =>
      onSelectionChange(
        applyGeographyFilterChange(selection, { divisionId: divisionIdValue }),
      ),
    isLoading: enabled && divisionsLoading,
    hint: geographyTruncationHint(divisions.length, divisionsPage?.total ?? 0),
  };
  const district: GeographyComboboxBindings = {
    value: selection.districtId,
    selectedLabel: districtLabel,
    options: districtOptions,
    searchTerm: districtSearch,
    onSearchTermChange: setDistrictSearch,
    onChange: (districtIdValue) =>
      onSelectionChange(
        applyGeographyFilterChange(selection, { districtId: districtIdValue }),
      ),
    isLoading: enabled && districtsLoading,
    hint: geographyTruncationHint(districts.length, districtsPage?.total ?? 0),
  };
  const upazila: GeographyComboboxBindings = {
    value: selection.upazilaId,
    selectedLabel: upazilaLabel,
    options: upazilaOptions,
    searchTerm: upazilaSearch,
    onSearchTermChange: setUpazilaSearch,
    onChange: (upazilaIdValue) =>
      onSelectionChange(
        applyGeographyFilterChange(selection, { upazilaId: upazilaIdValue }),
      ),
    isLoading: enabled && upazilasLoading,
    hint: geographyTruncationHint(upazilas.length, upazilasPage?.total ?? 0),
  };

  return buildGeographyFilterSection({
    idPrefix,
    division,
    district,
    upazila,
  });
}
