import { useMemo } from 'react';
import type { ComboboxOption, SelectOption } from '@/components/ui';
import { SettingsFilterRenderer } from '@/components/common/SettingsFilterRenderer';
import type { SettingsFilterSection } from '@/components/common/settingsFilter.types';
import { dateRangeValidationMessage } from '@/features/badges/utils/badgeForm';
import type { BadgeManagementFilters } from '@/features/badges/types/badge.types';

export interface BadgeManagementFiltersPanelProps {
  filters: BadgeManagementFilters;
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
  const dateValidationMessage = dateRangeValidationMessage(
    filters.createdFrom,
    filters.createdTo,
  );
  const dateInvalid = dateValidationMessage !== null;

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

  const sections = useMemo<SettingsFilterSection[]>(
    () => [
      {
        id: 'badge-filters-general',
        label: 'General',
        fields: [
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
            errorMessage: dateValidationMessage ?? undefined,
          },
        ],
      },
    ],
    [
      createdBySelectOptions,
      dateInvalid,
      dateValidationMessage,
      filters,
      moduleComboboxOptions,
      moduleOptionsLoading,
      moduleSearchTerm,
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
