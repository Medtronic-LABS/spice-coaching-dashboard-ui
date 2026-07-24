import type { IngestDuplicateErrorDetail } from '@/features/ingest/api/adminIngestApi';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFetchBaseQueryError(
  error: unknown,
): error is { status: number; data?: unknown } {
  return (
    isRecord(error) && 'status' in error && typeof error.status === 'number'
  );
}

function isIngestDuplicateErrorDetail(
  value: unknown,
): value is IngestDuplicateErrorDetail {
  if (!isRecord(value)) return false;
  if (value.code !== 'duplicate_content') return false;
  if (typeof value.message !== 'string') return false;
  if (!Array.isArray(value.conflicts)) return false;
  return value.conflicts.every(
    (conflict) =>
      isRecord(conflict) &&
      typeof conflict.filename === 'string' &&
      typeof conflict.title === 'string',
  );
}

/** Parse RTK Query 409 duplicate_content errors from POST /admin/ingest. */
export function parseIngestDuplicateError(
  error: unknown,
): IngestDuplicateErrorDetail | null {
  if (!isFetchBaseQueryError(error) || error.status !== 409) return null;

  const data = error.data;
  if (!isRecord(data)) return null;

  const detail = data.detail;
  if (isIngestDuplicateErrorDetail(detail)) return detail;

  if (isIngestDuplicateErrorDetail(data)) return data;

  return null;
}

/** Build per-file override flags aligned to upload order. */
export function buildOverrideFlags(
  files: File[],
  conflictFilenames: ReadonlySet<string>,
): boolean[] {
  return files.map((file) => conflictFilenames.has(file.name));
}

export function conflictFilenamesFromList(
  conflicts: ReadonlyArray<{ filename: string }>,
): Set<string> {
  return new Set(conflicts.map((conflict) => conflict.filename));
}

/** Filter files and parallel titles to only those matching conflict filenames. */
export function selectFilesForConflicts(
  files: File[],
  syncPublishedVisible: boolean[] | null | undefined,
  conflicts: ReadonlyArray<{ filename: string; title: string }>,
): {
  files: File[];
  syncPublishedVisible: boolean[] | null;
} {
  const conflictNames = conflictFilenamesFromList(conflicts);
  const selectedFiles = files.filter((file) => conflictNames.has(file.name));
  const hasAlignedVisibility = Boolean(
    syncPublishedVisible && syncPublishedVisible.length === files.length,
  );

  if (!hasAlignedVisibility) {
    return {
      files: selectedFiles,
      syncPublishedVisible: null,
    };
  }

  const selectedVisibility = hasAlignedVisibility
    ? files
        .map((file, index) => ({
          file,
          visible: Boolean(syncPublishedVisible?.[index]),
        }))
        .filter(({ file }) => conflictNames.has(file.name))
        .map(({ visible }) => visible)
    : null;

  return {
    files: selectedFiles,
    syncPublishedVisible: selectedVisibility,
  };
}
