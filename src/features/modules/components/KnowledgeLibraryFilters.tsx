import { useMemo } from 'react';
import type { SelectOption } from '@/components/ui';
import { SettingsFilterRenderer } from '@/components/common/SettingsFilterRenderer';
import type { SettingsFilterSection } from '@/components/common/settingsFilter.types';
import { dateRangeValidationMessage } from '@/features/modules/utils/moduleListFilters';
import {
  isKnowledgeDrawerDateRangeInvalid,
  type KnowledgeLibraryDrawerFilters,
} from '@/features/modules/utils/knowledgeLibraryFilters';

export interface KnowledgeLibraryFiltersProps {
  filters: KnowledgeLibraryDrawerFilters;
  uploaderOptions: SelectOption[];
  onChange: (filters: KnowledgeLibraryDrawerFilters) => void;
  onClearAll: () => void;
  onApply: () => void;
  applyDisabled?: boolean;
}

const ASSIGNED_OPTIONS: SelectOption[] = [
  { label: 'All', value: 'all' },
  { label: 'Assigned (Y)', value: 'yes' },
  { label: 'Unassigned (N)', value: 'no' },
];

export const KnowledgeLibraryFilters = ({
  filters,
  uploaderOptions,
  onChange,
  onClearAll,
  onApply,
  applyDisabled = false,
}: KnowledgeLibraryFiltersProps) => {
  const dateRangeInvalid = isKnowledgeDrawerDateRangeInvalid(filters);

  const uploadedByOptions = useMemo<SelectOption[]>(
    () => [{ label: 'All uploaders', value: '' }, ...uploaderOptions],
    [uploaderOptions],
  );

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
            type: 'select',
            id: 'knowledge-filter-uploaded-by',
            label: 'Uploaded by',
            value: filters.uploadedBy,
            options: uploadedByOptions,
            onChange: (uploadedBy) => onChange({ ...filters, uploadedBy }),
          },
          {
            type: 'select',
            id: 'knowledge-filter-assigned',
            label: 'Assigned',
            value: filters.assigned,
            options: ASSIGNED_OPTIONS,
            onChange: (assigned) =>
              onChange({
                ...filters,
                assigned: assigned as KnowledgeLibraryDrawerFilters['assigned'],
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
      updatedValidation,
      uploadedByOptions,
      uploadedValidation,
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
