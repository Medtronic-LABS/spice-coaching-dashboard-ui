import { useMemo } from 'react';
import type { ComboboxOption, SelectOption } from '@/components/ui';
import { SettingsFilterRenderer } from '@/components/common/SettingsFilterRenderer';
import type { SettingsFilterSection } from '@/components/common/settingsFilter.types';
import { isDateRangeInvalid } from '@/features/badges/utils/badgeForm';
import type { BadgeManagementFilters } from '@/features/badges/types/badge.types';
import { formatModuleDomainLabel } from '@/features/modules/utils/moduleListFilters';

export interface BadgeManagementFiltersPanelProps {
  filters: BadgeManagementFilters;
  domainOptions: ComboboxOption[];
  domainSearchTerm: string;
  onDomainSearchTermChange: (term: string) => void;
  domainOptionsLoading?: boolean;
  createdByOptions: string[];
  moduleOptions: ComboboxOption[];
  moduleSearchTerm: string;
  onModuleSearchTermChange: (term: string) => void;
  moduleOptionsLoading?: boolean;
  onChange: (filters: BadgeManagementFilters) => void;
  onClearAll: () => void;
  onApply: () => void;
  applyDisabled?: boolean;
}

export const BadgeManagementFiltersPanel = ({
  filters,
  domainOptions,
  domainSearchTerm,
  onDomainSearchTermChange,
  domainOptionsLoading = false,
  createdByOptions,
  moduleOptions,
  moduleSearchTerm,
  onModuleSearchTermChange,
  moduleOptionsLoading = false,
  onChange,
  onClearAll,
  onApply,
  applyDisabled = false,
}: BadgeManagementFiltersPanelProps) => {
  const dateInvalid = isDateRangeInvalid(
    filters.createdFrom,
    filters.createdTo,
  );

  const domainComboboxOptions: ComboboxOption[] = useMemo(() => {
    const allOption: ComboboxOption = { label: 'All domains', value: '' };
    const withoutEmpty = domainOptions.filter((option) => option.value !== '');
    return [allOption, ...withoutEmpty];
  }, [domainOptions]);

  const createdBySelectOptions: SelectOption[] = useMemo(
    () => [
      { label: 'All creators', value: '' },
      ...createdByOptions.map((creator) => ({
        label: creator,
        value: creator,
      })),
    ],
    [createdByOptions],
  );

  const moduleComboboxOptions: ComboboxOption[] = useMemo(
    () => [{ label: 'All modules', value: '' }, ...moduleOptions],
    [moduleOptions],
  );

  const domainSelectedLabel = filters.domain
    ? formatModuleDomainLabel(filters.domain)
    : 'All domains';

  const sections = useMemo<SettingsFilterSection[]>(
    () => [
      {
        id: 'badge-filters-general',
        label: 'General',
        fields: [
          {
            type: 'combobox',
            id: 'badge-filter-domain',
            label: 'Domain',
            value: filters.domain,
            selectedLabel: domainSelectedLabel,
            options: domainComboboxOptions,
            searchTerm: domainSearchTerm,
            onSearchTermChange: onDomainSearchTermChange,
            onChange: (domain) => onChange({ ...filters, domain }),
            isLoading: domainOptionsLoading,
            placeholder: 'Type to search domains…',
            emptyMessage: 'No domains match your search',
          },
          {
            type: 'select',
            id: 'badge-filter-created-by',
            label: 'Created By',
            value: filters.createdBy,
            options: createdBySelectOptions,
            onChange: (createdBy) => onChange({ ...filters, createdBy }),
          },
          {
            type: 'combobox',
            id: 'badge-filter-module',
            label: 'Module',
            value: filters.moduleTitle,
            selectedLabel: filters.moduleTitle,
            options: moduleComboboxOptions,
            searchTerm: moduleSearchTerm,
            onSearchTermChange: onModuleSearchTermChange,
            onChange: (moduleTitle) => onChange({ ...filters, moduleTitle }),
            isLoading: moduleOptionsLoading,
            placeholder: 'Type to search modules…',
            emptyMessage: 'No modules match your search',
          },
          {
            type: 'date-range',
            id: 'badge-filter-created-date',
            label: 'Created Date',
            from: {
              id: 'badge-filter-created-from',
              value: filters.createdFrom,
              ariaLabel: 'Created date from',
              onChange: (createdFrom) => onChange({ ...filters, createdFrom }),
            },
            to: {
              id: 'badge-filter-created-to',
              value: filters.createdTo,
              ariaLabel: 'Created date to',
              onChange: (createdTo) => onChange({ ...filters, createdTo }),
            },
            invalid: dateInvalid,
            errorMessage: dateInvalid
              ? 'Created date From must be on or before To.'
              : undefined,
          },
        ],
      },
    ],
    [
      createdBySelectOptions,
      dateInvalid,
      domainComboboxOptions,
      domainOptionsLoading,
      domainSearchTerm,
      domainSelectedLabel,
      filters,
      moduleComboboxOptions,
      moduleOptionsLoading,
      moduleSearchTerm,
      onDomainSearchTermChange,
      onModuleSearchTermChange,
      onChange,
    ],
  );

  return (
    <SettingsFilterRenderer
      sections={sections}
      onClearAll={onClearAll}
      onApply={onApply}
      applyDisabled={applyDisabled || dateInvalid}
    />
  );
};
