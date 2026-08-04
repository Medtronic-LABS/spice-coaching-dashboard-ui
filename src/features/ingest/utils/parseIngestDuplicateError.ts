import type {
  AdminV3IngestUploadPayload,
  AdminV3IngestUploadResponse,
  AdminV3IngestUploadedSource,
  IngestContentDomain,
  IngestDuplicateConflict,
  IngestDuplicateErrorDetail,
  IngestSourceType,
} from '@/features/ingest/api/adminIngestApi';

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

function fileExtension(filename: string): string {
  const trimmed = filename.trim().toLowerCase();
  const lastDot = trimmed.lastIndexOf('.');
  if (lastDot <= 0 || lastDot === trimmed.length - 1) return '';
  return trimmed.slice(lastDot + 1);
}

function inferSourceType(filename: string): IngestSourceType {
  const extension = fileExtension(filename);
  switch (extension) {
    case 'pdf':
      return 'pdf';
    case 'docx':
      return 'docx';
    case 'ppt':
    case 'pptx':
      return 'pptx';
    case 'mp3':
    case 'wav':
    case 'm4a':
    case 'flac':
    case 'ogg':
      return 'audio';
    default:
      return 'pdf';
  }
}

function isIngestDuplicateConflict(
  value: unknown,
): value is IngestDuplicateConflict {
  if (!isRecord(value)) return false;
  if (typeof value.filename !== 'string') return false;
  if (typeof value.title !== 'string') return false;
  if (!Array.isArray(value.existing_source_documents)) return false;
  return value.existing_source_documents.every(
    (existing) =>
      isRecord(existing) &&
      typeof existing.source_document_id === 'string' &&
      typeof existing.title === 'string',
  );
}

function isIngestDuplicateErrorDetail(
  value: unknown,
): value is IngestDuplicateErrorDetail {
  if (!isRecord(value)) return false;
  if (value.code !== 'duplicate_content') return false;
  if (!Array.isArray(value.conflicts)) return false;
  return value.conflicts.every(isIngestDuplicateConflict);
}

/** Parse RTK Query 409 duplicate_content errors from ingest upload/start. */
export function parseIngestDuplicateError(
  error: unknown,
): IngestDuplicateErrorDetail | null {
  if (!isFetchBaseQueryError(error) || error.status !== 409) return null;

  const data = error.data;
  if (!isRecord(data)) return null;

  const nestedDetail = data.detail;
  if (isIngestDuplicateErrorDetail(nestedDetail)) return nestedDetail;

  if (
    data.code === 'duplicate_content' &&
    Array.isArray(data.conflicts) &&
    data.conflicts.every(isIngestDuplicateConflict)
  ) {
    const message =
      typeof data.detail === 'string'
        ? data.detail
        : typeof data.title === 'string'
          ? data.title
          : 'Duplicate content';
    return {
      code: 'duplicate_content',
      message,
      conflicts: data.conflicts,
    };
  }

  if (isIngestDuplicateErrorDetail(data)) return data;

  return null;
}

export function uploadedSourceFromConflict(
  conflict: IngestDuplicateConflict,
  contentDomain?: IngestContentDomain | null,
): AdminV3IngestUploadedSource | null {
  const existing = conflict.existing_source_documents[0];
  if (!existing) return null;

  return {
    source_document_id: existing.source_document_id,
    title: existing.title || conflict.title,
    source_type: inferSourceType(conflict.filename),
    stored_path: '',
    content_domain: contentDomain ?? null,
    status: existing.status || 'uploaded',
  };
}

function titleFromFilename(filename: string): string {
  const trimmed = filename.trim();
  const dot = trimmed.lastIndexOf('.');
  if (dot <= 0) return trimmed;
  return trimmed.slice(0, dot) || trimmed;
}

function sourceMatchesDuplicateConflict(
  source: AdminV3IngestUploadedSource,
  conflict: IngestDuplicateConflict,
): boolean {
  const derivedTitle = titleFromFilename(conflict.filename);
  const existingId = conflict.existing_source_documents[0]?.source_document_id;
  return (
    source.source_document_id === existingId ||
    source.title === conflict.filename ||
    source.title === conflict.title ||
    source.title === derivedTitle
  );
}

/** True when a duplicate was re-uploaded as a new source instead of reusing existing. */
export function isOverriddenUploadedSource(
  source: AdminV3IngestUploadedSource,
  overriddenFilenames: readonly string[],
  duplicateConflicts: readonly IngestDuplicateConflict[] | undefined,
): boolean {
  if (!overriddenFilenames.length || !duplicateConflicts?.length) return false;

  const overriddenSet = new Set(overriddenFilenames);
  for (const conflict of duplicateConflicts) {
    if (!overriddenSet.has(conflict.filename)) continue;
    if (!sourceMatchesDuplicateConflict(source, conflict)) continue;

    const existingId =
      conflict.existing_source_documents[0]?.source_document_id;
    return !existingId || source.source_document_id !== existingId;
  }

  return false;
}

export function uploadedSourcesFromConflicts(
  conflicts: IngestDuplicateConflict[],
  contentDomain?: IngestContentDomain | null,
): AdminV3IngestUploadedSource[] {
  const sources: AdminV3IngestUploadedSource[] = [];
  for (const conflict of conflicts) {
    const source = uploadedSourceFromConflict(conflict, contentDomain);
    if (source) sources.push(source);
  }
  return sources;
}

function dedupeUploadedSources(
  sources: AdminV3IngestUploadedSource[],
): AdminV3IngestUploadedSource[] {
  const byId = new Map<string, AdminV3IngestUploadedSource>();
  for (const source of sources) {
    byId.set(source.source_document_id, source);
  }
  return [...byId.values()];
}

/** Merge newly uploaded sources with already-uploaded duplicates for ingest. */
export function normalizeUploadResponse(
  payload: AdminV3IngestUploadPayload,
  response: AdminV3IngestUploadResponse,
): AdminV3IngestUploadResponse {
  const skippedByFilename = new Map(
    (response.skipped_duplicates ?? []).map((conflict) => [
      conflict.filename,
      conflict,
    ]),
  );
  const orderedSources: AdminV3IngestUploadedSource[] = [];
  let newSourceIndex = 0;

  for (let index = 0; index < payload.files.length; index += 1) {
    const file = payload.files[index];
    const skipped = skippedByFilename.get(file.name);
    if (skipped) {
      const domain = payload.content_domains?.[index] ?? null;
      const existing = uploadedSourceFromConflict(skipped, domain);
      if (existing) orderedSources.push(existing);
      continue;
    }

    const uploaded = response.sources[newSourceIndex];
    if (uploaded) {
      orderedSources.push(uploaded);
      newSourceIndex += 1;
    }
  }

  return {
    status: 'uploaded',
    sources: dedupeUploadedSources(orderedSources),
    skipped_duplicates: response.skipped_duplicates,
  };
}

export function uploadResponseFromDuplicateConflicts(
  payload: AdminV3IngestUploadPayload,
  conflicts: IngestDuplicateConflict[],
): AdminV3IngestUploadResponse {
  const skippedByFilename = new Map(
    conflicts.map((conflict) => [conflict.filename, conflict]),
  );
  const sources: AdminV3IngestUploadedSource[] = [];

  for (let index = 0; index < payload.files.length; index += 1) {
    const file = payload.files[index];
    const conflict = skippedByFilename.get(file.name);
    if (!conflict) continue;
    const domain = payload.content_domains?.[index] ?? null;
    const source = uploadedSourceFromConflict(conflict, domain);
    if (source) sources.push(source);
  }

  return {
    status: 'uploaded',
    sources: dedupeUploadedSources(sources),
    skipped_duplicates: conflicts,
  };
}

/** Build per-file override flags aligned to upload order. */
export function buildOverrideFlags(
  files: File[],
  conflictFilenames: ReadonlySet<string>,
): boolean[] {
  return files.map((file) => conflictFilenames.has(file.name));
}

export function buildIngestOverrideFlags(
  sourceDocumentIds: string[],
  conflicts: IngestDuplicateConflict[],
): boolean[] {
  const duplicateIds = new Set<string>();
  for (const conflict of conflicts) {
    for (const existing of conflict.existing_source_documents) {
      duplicateIds.add(existing.source_document_id);
    }
  }
  return sourceDocumentIds.map((id) => duplicateIds.has(id));
}

export function conflictFilenamesFromList(
  conflicts: ReadonlyArray<{ filename: string }>,
): Set<string> {
  return new Set(conflicts.map((conflict) => conflict.filename));
}

/** Conflicts the user left unchecked when resolving duplicate ingest. */
export function conflictsKeptExisting(
  conflicts: readonly IngestDuplicateConflict[],
  selectedFilenames: readonly string[],
): IngestDuplicateConflict[] {
  const selected = conflictFilenamesFromList(
    selectedFilenames.map((filename) => ({ filename })),
  );
  return conflicts.filter((conflict) => !selected.has(conflict.filename));
}

/** True when every source in the ingest payload is covered by duplicate conflicts. */
export function allPayloadSourcesAreIngestDuplicates(
  sourceDocumentIds: readonly string[],
  conflicts: readonly IngestDuplicateConflict[],
): boolean {
  if (sourceDocumentIds.length === 0 || conflicts.length === 0) return false;

  const duplicateSourceIds = new Set<string>();
  for (const conflict of conflicts) {
    for (const existing of conflict.existing_source_documents) {
      duplicateSourceIds.add(existing.source_document_id);
    }
  }

  return sourceDocumentIds.every((id) => duplicateSourceIds.has(id));
}

export function sourceDocumentFromDuplicateConflict(
  conflict: IngestDuplicateConflict,
): { sourceDocumentId: string; title: string } | null {
  const existing = conflict.existing_source_documents[0];
  if (!existing?.source_document_id) return null;

  return {
    sourceDocumentId: existing.source_document_id,
    title: existing.title || conflict.title || conflict.filename,
  };
}

/** Resolve view-modules target when an uploaded source was kept as already ingested. */
export function findKeptExistingTargetForSource(
  source: AdminV3IngestUploadedSource,
  conflicts: readonly IngestDuplicateConflict[] | undefined,
): { sourceDocumentId: string; title: string } | null {
  if (!conflicts?.length) return null;

  for (const conflict of conflicts) {
    const target = sourceDocumentFromDuplicateConflict(conflict);
    if (!target) continue;

    const derivedTitle = titleFromFilename(conflict.filename);
    if (
      source.source_document_id === target.sourceDocumentId ||
      source.title === conflict.filename ||
      source.title === conflict.title ||
      source.title === derivedTitle
    ) {
      return target;
    }
  }

  return null;
}

/** Filter files and parallel visibility to only those matching conflict filenames. */
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

  const selectedVisibility = files
    .map((file, index) => ({
      file,
      visible: Boolean(syncPublishedVisible?.[index]),
    }))
    .filter(({ file }) => conflictNames.has(file.name))
    .map(({ visible }) => visible);

  return {
    files: selectedFiles,
    syncPublishedVisible: selectedVisibility,
  };
}
