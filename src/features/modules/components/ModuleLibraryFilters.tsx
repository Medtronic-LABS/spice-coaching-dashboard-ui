import { useMemo } from 'react';
import type { ComboboxOption, SelectOption } from '@/components/ui';
import { SettingsFilterRenderer } from '@/components/common/SettingsFilterRenderer';
import type { SettingsFilterSection } from '@/components/common/settingsFilter.types';
import {
  dateRangeValidationMessage,
  formatModuleDomainLabel,
  getAvailableDateFilterTypes,
  isAnyVisibleDateRangeInvalid,
  moduleDateFilterTypeLabel,
  type ModuleDateFilterType,
  type ModuleLibraryFilters as ModuleLibraryFilterState,
  type ModuleLibraryTab,
} from '@/features/modules/utils/moduleListFilters';

const DATE_FIELD_KEYS: Record<
  ModuleDateFilterType,
  { from: keyof ModuleLibraryFilterState; to: keyof ModuleLibraryFilterState }
> = {
  created: { from: 'createdFrom', to: 'createdTo' },
  published: { from: 'publishedFrom', to: 'publishedTo' },
  activated: { from: 'activatedFrom', to: 'activatedTo' },
  deactivated: { from: 'deactivatedFrom', to: 'deactivatedTo' },
};

export interface ModuleLibraryFiltersProps {
  filters: ModuleLibraryFilterState;
  tab: ModuleLibraryTab;
  isProgramManager: boolean;
  domains: string[];
  sourceDocumentOptions: ComboboxOption[];
  sourceDocumentId: string;
  sourceDocumentLabel: string;
  sourceDocumentSearch: string;
  sourceDocumentsLoading?: boolean;
  sourceDocumentsHint?: string;
  onSourceDocumentChange: (value: string) => void;
  onSourceDocumentSearchChange: (term: string) => void;
  onChange: (filters: ModuleLibraryFilterState) => void;
  onClearAll: () => void;
  onApply: () => void;
  applyDisabled?: boolean;
}

export const ModuleLibraryFilters = ({
  filters,
  tab,
  isProgramManager,
  domains,
  sourceDocumentOptions,
  sourceDocumentId,
  sourceDocumentLabel,
  sourceDocumentSearch,
  sourceDocumentsLoading = false,
  sourceDocumentsHint,
  onSourceDocumentChange,
  onSourceDocumentSearchChange,
  onChange,
  onClearAll,
  onApply,
  applyDisabled = false,
}: ModuleLibraryFiltersProps) => {
  const dateTypes = getAvailableDateFilterTypes(tab, isProgramManager);
  const dateRangeInvalid = isAnyVisibleDateRangeInvalid(
    filters,
    tab,
    isProgramManager,
  );

  const domainOptions: SelectOption[] = useMemo(
    () => [
      { label: 'All domains', value: '' },
      ...domains.map((domain) => ({
        label: formatModuleDomainLabel(domain),
        value: domain,
      })),
    ],
    [domains],
  );

  const sections = useMemo<SettingsFilterSection[]>(
    () => [
      {
        id: 'module-library-general',
        label: 'General',
        fields: [
          {
            type: 'combobox',
            id: 'module-filter-source-document',
            label: 'Source document',
            value: sourceDocumentId,
            selectedLabel: sourceDocumentLabel,
            options: sourceDocumentOptions,
            searchTerm: sourceDocumentSearch,
            onSearchTermChange: onSourceDocumentSearchChange,
            onChange: onSourceDocumentChange,
            isLoading: sourceDocumentsLoading,
            hint: sourceDocumentsHint,
            placeholder: 'Type to search documents…',
            emptyMessage: 'No documents match your search',
          },
          {
            type: 'select',
            id: 'module-filter-domain',
            label: 'Domain',
            value: filters.domain,
            options: domainOptions,
            onChange: (domain) => onChange({ ...filters, domain }),
          },
        ],
      },
      {
        id: 'module-library-date-ranges',
        label: 'Date ranges',
        fields: dateTypes.map((type) => {
          const keys = DATE_FIELD_KEYS[type];
          const fromValue = String(filters[keys.from]);
          const toValue = String(filters[keys.to]);
          const validationMessage = dateRangeValidationMessage(
            fromValue,
            toValue,
          );
          const label = moduleDateFilterTypeLabel(type);
          return {
            type: 'date-range' as const,
            id: `module-filter-${type}`,
            label,
            from: {
              id: `module-filter-${type}-from`,
              value: fromValue,
              ariaLabel: `${label} from`,
              onChange: (value: string) =>
                onChange({
                  ...filters,
                  [keys.from]: value,
                }),
            },
            to: {
              id: `module-filter-${type}-to`,
              value: toValue,
              ariaLabel: `${label} to`,
              onChange: (value: string) =>
                onChange({
                  ...filters,
                  [keys.to]: value,
                }),
            },
            invalid: validationMessage !== null,
            errorMessage: validationMessage ?? undefined,
          };
        }),
      },
    ],
    [
      dateTypes,
      domainOptions,
      filters,
      onChange,
      onSourceDocumentChange,
      onSourceDocumentSearchChange,
      sourceDocumentId,
      sourceDocumentLabel,
      sourceDocumentOptions,
      sourceDocumentSearch,
      sourceDocumentsHint,
      sourceDocumentsLoading,
    ],
  );

  return (
    <SettingsFilterRenderer
      sections={sections}
      onClearAll={onClearAll}
      onApply={onApply}
      applyDisabled={applyDisabled || dateRangeInvalid}
    />
  );
};
