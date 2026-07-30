import { useMemo } from 'react';
import type { ComboboxOption, SelectOption } from '@/components/ui';
import { SettingsFilterRenderer } from '@/components/common/SettingsFilterRenderer';
import type { SettingsFilterSection } from '@/components/common/settingsFilter.types';
import { dateRangeValidationMessage } from '@/features/modules/utils/moduleListFilters';
import {
  isKnowledgeDrawerDateRangeInvalid,
  type KnowledgeLibraryDrawerFilters,
} from '@/features/modules/utils/knowledgeLibraryFilters';
import type { KnowledgeYesNoFilter } from '@/features/modules/types/knowledgeLibrary.types';

export interface KnowledgeLibraryFiltersProps {
  filters: KnowledgeLibraryDrawerFilters;
  uploaderOptions: ComboboxOption[];
  uploadedByLabel: string;
  uploadedBySearch: string;
  uploadersLoading?: boolean;
  onUploadedBySearchChange: (term: string) => void;
  onChange: (filters: KnowledgeLibraryDrawerFilters) => void;
  onClearAll: () => void;
  onApply: () => void;
  applyDisabled?: boolean;
}

const YES_NO_FILTER_OPTIONS: SelectOption[] = [
  { label: 'All', value: 'all' },
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
];

function toYesNoFilter(value: string): KnowledgeYesNoFilter {
  if (value === 'yes' || value === 'no') return value;
  return 'all';
}

export const KnowledgeLibraryFilters = ({
  filters,
  uploaderOptions,
  uploadedByLabel,
  uploadedBySearch,
  uploadersLoading = false,
  onUploadedBySearchChange,
  onChange,
  onClearAll,
  onApply,
  applyDisabled = false,
}: KnowledgeLibraryFiltersProps) => {
  const dateRangeInvalid = isKnowledgeDrawerDateRangeInvalid(filters);

  const uploadedValidation = dateRangeValidationMessage(
    filters.uploadedAtFrom,
    filters.uploadedAtTo,
  );
  const updatedValidation = dateRangeValidationMessage(
    filters.updatedAtFrom,
    filters.updatedAtTo,
  );

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
            selectedLabel: uploadedByLabel,
            options: uploaderOptions,
            searchTerm: uploadedBySearch,
            onSearchTermChange: onUploadedBySearchChange,
            onChange: (uploadedBy) => onChange({ ...filters, uploadedBy }),
            isLoading: uploadersLoading,
            placeholder: 'Type to search uploaders…',
            emptyMessage: 'No uploaders match your search',
          },
          {
            type: 'segmented',
            id: 'knowledge-filter-assigned',
            label: 'Assigned',
            value: filters.assigned,
            options: YES_NO_FILTER_OPTIONS,
            onChange: (assigned) =>
              onChange({
                ...filters,
                assigned: toYesNoFilter(assigned),
              }),
          },
          {
            type: 'segmented',
            id: 'knowledge-filter-ingested',
            label: 'Ingested',
            value: filters.ingested,
            options: YES_NO_FILTER_OPTIONS,
            onChange: (ingested) =>
              onChange({
                ...filters,
                ingested: toYesNoFilter(ingested),
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
          {
            type: 'date-range',
            id: 'knowledge-filter-updated',
            label: 'Last updated',
            from: {
              id: 'knowledge-filter-updated-from',
              value: filters.updatedAtFrom,
              ariaLabel: 'Last updated from',
              onChange: (updatedAtFrom) =>
                onChange({ ...filters, updatedAtFrom }),
            },
            to: {
              id: 'knowledge-filter-updated-to',
              value: filters.updatedAtTo,
              ariaLabel: 'Last updated to',
              onChange: (updatedAtTo) => onChange({ ...filters, updatedAtTo }),
            },
            invalid: updatedValidation !== null,
            errorMessage: updatedValidation ?? undefined,
          },
        ],
      },
    ],
    [
      filters,
      onChange,
      onUploadedBySearchChange,
      updatedValidation,
      uploadedByLabel,
      uploadedBySearch,
      uploadedValidation,
      uploaderOptions,
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
