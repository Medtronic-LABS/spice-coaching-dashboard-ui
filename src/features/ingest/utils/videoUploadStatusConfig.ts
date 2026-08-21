import type { SourceDocumentStatus } from '@/features/modules/api/adminSourceDocumentsApi';
import { dateRangeValidationMessage } from '@/features/modules/utils/moduleListFilters';

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
  /** `YYYY-MM-DD` date input; converted to ISO `uploaded_from` on apply. */
  uploadedAtFrom: string;
  /** `YYYY-MM-DD` date input; converted to ISO `uploaded_to` on apply. */
  uploadedAtTo: string;
}

export const EMPTY_VIDEO_UPLOAD_FILTERS: VideoUploadFiltersState = {
  statuses: [],
  uploadedAtFrom: '',
  uploadedAtTo: '',
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

export function normalizeVideoUploadFilters(
  filters: VideoUploadFiltersState,
): VideoUploadFiltersState {
  return {
    statuses: normalizeVideoUploadStatuses(filters.statuses),
    uploadedAtFrom: filters.uploadedAtFrom.trim(),
    uploadedAtTo: filters.uploadedAtTo.trim(),
  };
}

export function hasActiveVideoUploadFilters(
  filters: VideoUploadFiltersState,
): boolean {
  return Boolean(
    filters.statuses.length > 0 ||
    filters.uploadedAtFrom.trim() ||
    filters.uploadedAtTo.trim(),
  );
}

export function isVideoUploadDateRangeInvalid(
  filters: VideoUploadFiltersState,
): boolean {
  return (
    dateRangeValidationMessage(filters.uploadedAtFrom, filters.uploadedAtTo) !==
    null
  );
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
