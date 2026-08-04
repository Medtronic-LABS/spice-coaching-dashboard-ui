import { useMemo } from 'react';
import { SettingsFilterRenderer } from '@/components/common/SettingsFilterRenderer';
import type { SettingsFilterSection } from '@/components/common/settingsFilter.types';
import {
  VIDEO_UPLOAD_STATUS_OPTIONS,
  type VideoUploadFiltersState,
  type VideoUploadStatusOption,
} from '@/features/ingest/utils/videoUploadStatusConfig';

interface VideoUploadFiltersProps {
  filters: VideoUploadFiltersState;
  onToggleStatus: (status: VideoUploadStatusOption['value']) => void;
  onClearAll: () => void;
  onApply: () => void;
}

export const VideoUploadFilters = ({
  filters,
  onToggleStatus,
  onClearAll,
  onApply,
}: VideoUploadFiltersProps) => {
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
    ],
    [filters.statuses, onToggleStatus],
  );

  return (
    <SettingsFilterRenderer
      sections={sections}
      onClearAll={onClearAll}
      onApply={onApply}
    />
  );
};
