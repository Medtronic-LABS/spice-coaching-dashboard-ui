import { useMemo } from 'react';
import { SettingsFilterRenderer } from '@/components/common/SettingsFilterRenderer';
import type { SettingsFilterSection } from '@/components/common/settingsFilter.types';
import {
  isVideoUploadDateRangeInvalid,
  VIDEO_UPLOAD_STATUS_OPTIONS,
  type VideoUploadFiltersState,
  type VideoUploadStatusOption,
} from '@/features/ingest/utils/videoUploadStatusConfig';
import { dateRangeValidationMessage } from '@/features/modules/utils/moduleListFilters';

interface VideoUploadFiltersProps {
  filters: VideoUploadFiltersState;
  onChange: (filters: VideoUploadFiltersState) => void;
  onToggleStatus: (status: VideoUploadStatusOption['value']) => void;
  onClearAll: () => void;
  onApply: () => void;
}

export const VideoUploadFilters = ({
  filters,
  onChange,
  onToggleStatus,
  onClearAll,
  onApply,
}: VideoUploadFiltersProps) => {
  const uploadedValidation = dateRangeValidationMessage(
    filters.uploadedAtFrom,
    filters.uploadedAtTo,
  );
  const dateRangeInvalid = isVideoUploadDateRangeInvalid(filters);

  const sections = useMemo<SettingsFilterSection[]>(
    () => [
      {
        id: 'video-upload-status',
        label: 'Status',
        fields: [
          {
            type: 'checkbox-group',
            id: 'video-upload-status-options',
            label: 'Status',
            description:
              'Select one or more statuses to narrow the uploaded videos table.',
            values: filters.statuses,
            options: VIDEO_UPLOAD_STATUS_OPTIONS,
            columns: 2,
            onToggle: (value) =>
              onToggleStatus(value as VideoUploadStatusOption['value']),
          },
        ],
      },
      {
        id: 'video-upload-date-ranges',
        label: 'Date ranges',
        fields: [
          {
            type: 'date-range',
            id: 'video-filter-uploaded',
            label: 'Uploaded',
            from: {
              id: 'video-filter-uploaded-from',
              value: filters.uploadedAtFrom,
              ariaLabel: 'Uploaded from',
              onChange: (uploadedAtFrom) =>
                onChange({ ...filters, uploadedAtFrom }),
            },
            to: {
              id: 'video-filter-uploaded-to',
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
    [filters, onChange, onToggleStatus, uploadedValidation],
  );

  return (
    <SettingsFilterRenderer
      sections={sections}
      onClearAll={onClearAll}
      onApply={onApply}
      applyDisabled={dateRangeInvalid}
    />
  );
};
