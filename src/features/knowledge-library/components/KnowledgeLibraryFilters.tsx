import { useMemo } from 'react';
import type { ComboboxOption } from '@/components/ui';
import { SettingsFilterRenderer } from '@/components/common/SettingsFilterRenderer';
import type { SettingsFilterSection } from '@/components/common/settingsFilter.types';
import { dateRangeValidationMessage } from '@/features/modules/utils/moduleListFilters';
import {
  isKnowledgeDrawerDateRangeInvalid,
  type KnowledgeLibraryDrawerFilters,
} from '@/features/knowledge-library/utils/knowledgeLibraryFilters';
import type { KnowledgeYesNoFilter } from '@/features/knowledge-library/types/knowledgeLibrary.types';

const YES_NO_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Yes', value: 'true' },
  { label: 'No', value: 'false' },
];

export interface KnowledgeLibraryFiltersProps {
  filters: KnowledgeLibraryDrawerFilters;
  onChange: (filters: KnowledgeLibraryDrawerFilters) => void;
  onClearAll: () => void;
  onApply: () => void;
  applyDisabled?: boolean;
  uploaderOptions: ComboboxOption[];
  uploaderSearch: string;
  onUploaderSearchChange: (term: string) => void;
  uploadersLoading?: boolean;
}

export const KnowledgeLibraryFilters = ({
  filters,
  onChange,
  onClearAll,
  onApply,
  applyDisabled = false,
  uploaderOptions,
  uploaderSearch,
  onUploaderSearchChange,
  uploadersLoading = false,
}: KnowledgeLibraryFiltersProps) => {
  const dateRangeInvalid = isKnowledgeDrawerDateRangeInvalid(filters);

  const uploadedValidation = dateRangeValidationMessage(
    filters.uploadedAtFrom,
    filters.uploadedAtTo,
  );

  const selectedUploaderLabel =
    uploaderOptions.find((option) => option.value === filters.uploadedBy)
      ?.label ?? filters.uploadedBy;

  const sections = useMemo<SettingsFilterSection[]>(
    () => [
      {
        id: 'knowledge-library-general',
        label: 'General',
        fields: [
          {
            type: 'combobox',
            id: 'knowledge-filter-uploaded-by',
            label: 'Uploaded by',
            value: filters.uploadedBy,
            selectedLabel: selectedUploaderLabel,
            options: uploaderOptions,
            searchTerm: uploaderSearch,
            onSearchTermChange: onUploaderSearchChange,
            onChange: (uploadedBy) => onChange({ ...filters, uploadedBy }),
            isLoading: uploadersLoading,
            placeholder: 'Search uploaders…',
            emptyMessage: 'No uploaders match your search',
          },
          {
            type: 'select',
            id: 'knowledge-filter-assigned',
            label: 'Assigned',
            value: filters.assigned,
            options: YES_NO_OPTIONS,
            onChange: (assigned) =>
              onChange({
                ...filters,
                assigned: assigned as KnowledgeYesNoFilter,
              }),
          },
          {
            type: 'select',
            id: 'knowledge-filter-ingested',
            label: 'Ingested',
            value: filters.ingested,
            options: YES_NO_OPTIONS,
            onChange: (ingested) =>
              onChange({
                ...filters,
                ingested: ingested as KnowledgeYesNoFilter,
              }),
          },
        ],
      },
      {
        id: 'knowledge-library-date-ranges',
        label: 'Date ranges',
        fields: [
          {
            type: 'date-range',
            id: 'knowledge-filter-uploaded',
            label: 'Uploaded',
            from: {
              id: 'knowledge-filter-uploaded-from',
              value: filters.uploadedAtFrom,
              ariaLabel: 'Uploaded from',
              onChange: (uploadedAtFrom) =>
                onChange({ ...filters, uploadedAtFrom }),
            },
            to: {
              id: 'knowledge-filter-uploaded-to',
              value: filters.uploadedAtTo,
              ariaLabel: 'Uploaded to',
              onChange: (uploadedAtTo) =>
                onChange({ ...filters, uploadedAtTo }),
            },
            invalid: uploadedValidation !== null,
            errorMessage: uploadedValidation ?? undefined,
          },
        ],
      },
    ],
    [
      filters,
      onChange,
      onUploaderSearchChange,
      selectedUploaderLabel,
      uploadedValidation,
      uploaderOptions,
      uploaderSearch,
      uploadersLoading,
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
