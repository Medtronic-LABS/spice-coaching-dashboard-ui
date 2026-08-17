import type {
  SettingsFilterComboboxField,
  SettingsFilterSection,
} from '@/components/common/settingsFilter.types';
import type { ComboboxOption } from '@/components/ui';

export type GeographyFilterState = {
  divisionId: string;
  districtId: string;
  upazilaId: string;
};

export const EMPTY_GEOGRAPHY_FILTERS: GeographyFilterState = {
  divisionId: '',
  districtId: '',
  upazilaId: '',
};

export const GEOGRAPHY_ALL_LABELS = {
  division: 'All divisions',
  district: 'All districts',
  upazila: 'All upazilas',
} as const;

export type GeographyQueryParams = {
  division_id?: number;
  district_id?: number;
  upazila_id?: number;
};

export type GeographyComboboxBindings = {
  value: string;
  selectedLabel: string;
  options: ComboboxOption[];
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  onChange: (value: string) => void;
  isLoading?: boolean;
  hint?: string;
};

/** Keep only a positive integer id; anything else becomes empty. */
export function parseGeographyIdParam(
  value: string | null | undefined,
): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (!/^[1-9]\d*$/.test(trimmed)) return '';
  return trimmed;
}

export function parseGeographyId(value: string): number | undefined {
  const parsed = parseGeographyIdParam(value);
  if (!parsed) return undefined;
  return Number.parseInt(parsed, 10);
}

export function normalizeGeographyFilters(
  filters: GeographyFilterState,
): GeographyFilterState {
  return {
    divisionId: parseGeographyIdParam(filters.divisionId),
    districtId: parseGeographyIdParam(filters.districtId),
    upazilaId: parseGeographyIdParam(filters.upazilaId),
  };
}

export function hasActiveGeographyFilters(
  filters: GeographyFilterState,
): boolean {
  return Boolean(filters.divisionId || filters.districtId || filters.upazilaId);
}

/**
 * Changing Division clears District and Upazila.
 * Changing District clears Upazila.
 */
export function applyGeographyFilterChange(
  current: GeographyFilterState,
  patch: Partial<GeographyFilterState>,
): GeographyFilterState {
  const next: GeographyFilterState = { ...current, ...patch };
  if (
    patch.divisionId !== undefined &&
    patch.divisionId !== current.divisionId
  ) {
    next.districtId = patch.districtId ?? '';
    next.upazilaId = patch.upazilaId ?? '';
  } else if (
    patch.districtId !== undefined &&
    patch.districtId !== current.districtId
  ) {
    next.upazilaId = patch.upazilaId ?? '';
  }
  return next;
}

export function toGeographyQueryParams(
  filters: GeographyFilterState,
): GeographyQueryParams {
  const divisionId = parseGeographyId(filters.divisionId);
  const districtId = parseGeographyId(filters.districtId);
  const upazilaId = parseGeographyId(filters.upazilaId);
  return {
    ...(divisionId !== undefined ? { division_id: divisionId } : {}),
    ...(districtId !== undefined ? { district_id: districtId } : {}),
    ...(upazilaId !== undefined ? { upazila_id: upazilaId } : {}),
  };
}

export function geographyTruncationHint(
  shownCount: number,
  total: number,
): string | undefined {
  if (total <= shownCount) return undefined;
  return `Showing ${shownCount} of ${total}. Type to search.`;
}

/** Prepends an "All" option and keeps a selected value visible even if it is not in the current page. */
export function prependGeographyAllOption(
  allLabel: string,
  items: Array<{ id: number; name: string }>,
  selectedValue: string,
  selectedLabel: string,
): ComboboxOption[] {
  const options: ComboboxOption[] = [{ label: allLabel, value: '' }];
  const seen = new Set<string>(['']);
  for (const item of items) {
    const value = String(item.id);
    if (seen.has(value)) continue;
    seen.add(value);
    options.push({ label: item.name, value });
  }
  if (selectedValue && !seen.has(selectedValue)) {
    options.push({
      label: selectedLabel || selectedValue,
      value: selectedValue,
    });
  }
  return options;
}

function geographyComboboxField(
  id: string,
  label: string,
  noun: string,
  bindings: GeographyComboboxBindings,
): SettingsFilterComboboxField {
  return {
    type: 'combobox',
    id,
    label,
    value: bindings.value,
    selectedLabel: bindings.selectedLabel,
    options: bindings.options,
    searchTerm: bindings.searchTerm,
    onSearchTermChange: bindings.onSearchTermChange,
    onChange: bindings.onChange,
    isLoading: bindings.isLoading,
    hint: bindings.hint,
    placeholder: `Type to search ${noun}…`,
    emptyMessage: `No ${noun} match your search`,
  };
}

export function buildGeographyFilterSection(args: {
  idPrefix: string;
  division: GeographyComboboxBindings;
  district: GeographyComboboxBindings;
  upazila: GeographyComboboxBindings;
}): SettingsFilterSection {
  return {
    id: `${args.idPrefix}-geography`,
    label: 'Geography',
    fields: [
      geographyComboboxField(
        `${args.idPrefix}-filter-division`,
        'Division',
        'divisions',
        args.division,
      ),
      geographyComboboxField(
        `${args.idPrefix}-filter-district`,
        'District',
        'districts',
        args.district,
      ),
      geographyComboboxField(
        `${args.idPrefix}-filter-upazila`,
        'Upazila',
        'upazilas',
        args.upazila,
      ),
    ],
  };
}
