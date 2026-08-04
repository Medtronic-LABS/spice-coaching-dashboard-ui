import type { SourceDocumentStatus } from '@/features/modules/api/adminSourceDocumentsApi';

export interface VideoUploadStatusOption {
  value: SourceDocumentStatus;
  label: string;
}

export const VIDEO_UPLOAD_STATUS_OPTIONS: VideoUploadStatusOption[] = [
  { value: 'uploaded', label: 'Uploaded' },
  { value: 'ingesting', label: 'Ingesting' },
  { value: 'ingested', label: 'Ingested' },
  { value: 'failed', label: 'Failed' },
];

export interface VideoUploadFiltersState {
  statuses: SourceDocumentStatus[];
}

export const EMPTY_VIDEO_UPLOAD_FILTERS: VideoUploadFiltersState = {
  statuses: [],
};

const VALID_VIDEO_UPLOAD_STATUSES = new Set(
  VIDEO_UPLOAD_STATUS_OPTIONS.map((option) => option.value),
);

export function normalizeVideoUploadStatuses(
  statuses: readonly string[],
): SourceDocumentStatus[] {
  const seen = new Set<SourceDocumentStatus>();
  const normalized: SourceDocumentStatus[] = [];

  for (const status of statuses) {
    if (!VALID_VIDEO_UPLOAD_STATUSES.has(status as SourceDocumentStatus)) {
      continue;
    }
    const typedStatus = status as SourceDocumentStatus;
    if (seen.has(typedStatus)) continue;
    seen.add(typedStatus);
    normalized.push(typedStatus);
  }

  return normalized;
}

export function hasActiveVideoUploadFilters(
  filters: VideoUploadFiltersState,
): boolean {
  return filters.statuses.length > 0;
}

export function toggleVideoUploadStatus(
  filters: VideoUploadFiltersState,
  status: SourceDocumentStatus,
): VideoUploadFiltersState {
  return filters.statuses.includes(status)
    ? {
        ...filters,
        statuses: filters.statuses.filter((value) => value !== status),
      }
    : {
        ...filters,
        statuses: [...filters.statuses, status],
      };
}
