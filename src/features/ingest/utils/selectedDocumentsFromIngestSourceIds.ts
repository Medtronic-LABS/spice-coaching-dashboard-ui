import type {
  AdminV3IngestAcceptedSource,
  AdminV3IngestBatchSourceStatus,
  AdminV3IngestUploadResponse,
} from '@/features/ingest/api/adminIngestApi';
import { MAX_DOCUMENT_SELECTION } from '@/features/ingest/constants/documentSelection';
import type { SelectedIngestDocument } from '@/features/ingest/types/documentSelection.types';
import type {
  ActiveIngestSession,
  KeptExistingIngestSource,
} from '@/features/ingest/utils/ingestSessionStorage';
import { selectedIngestDocumentsFromUploadResponse } from '@/features/ingest/utils/parseIngestDuplicateError';

function upsertSelectedDocument(
  byId: Map<string, SelectedIngestDocument>,
  next: SelectedIngestDocument,
): void {
  const existing = byId.get(next.id);
  byId.set(next.id, {
    id: next.id,
    title: next.title.trim() || existing?.title || next.id,
    originalFilename:
      next.originalFilename ?? existing?.originalFilename ?? null,
    sourceType: next.sourceType || existing?.sourceType || 'pdf',
    status: next.status || existing?.status || 'uploaded',
    uploadedAt: next.uploadedAt || existing?.uploadedAt,
  });
}

function normalizeDocumentMatchKey(value: string | null | undefined): string {
  const trimmed = value?.trim().toLowerCase() ?? '';
  if (!trimmed) return '';
  const dot = trimmed.lastIndexOf('.');
  const withoutExtension = dot > 0 ? trimmed.slice(0, dot) : trimmed;
  return withoutExtension.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function documentMatchKeys(
  title: string | null | undefined,
  originalFilename: string | null | undefined,
): Set<string> {
  const keys = new Set<string>();
  for (const value of [title, originalFilename]) {
    const key = normalizeDocumentMatchKey(value);
    if (key) keys.add(key);
  }
  return keys;
}

function collectBatchSourceDocumentIds(
  acceptedSources?: readonly AdminV3IngestAcceptedSource[],
  statusSources?: readonly AdminV3IngestBatchSourceStatus[],
): Set<string> {
  const ids = new Set<string>();
  for (const source of acceptedSources ?? []) {
    if (source.source_document_id) ids.add(source.source_document_id);
  }
  for (const source of statusSources ?? []) {
    if (source.source_document_id) ids.add(source.source_document_id);
  }
  return ids;
}

function collectBatchDocumentMatchKeys(
  acceptedSources?: readonly AdminV3IngestAcceptedSource[],
  statusSources?: readonly AdminV3IngestBatchSourceStatus[],
): Set<string> {
  const keys = new Set<string>();
  for (const source of acceptedSources ?? []) {
    for (const key of documentMatchKeys(source.title, source.title)) {
      keys.add(key);
    }
  }
  for (const source of statusSources ?? []) {
    for (const key of documentMatchKeys(
      source.document_label,
      source.document_label,
    )) {
      keys.add(key);
    }
  }
  return keys;
}

function isSupersededByActiveBatchSource(
  doc: SelectedIngestDocument,
  batchSourceIds: Set<string>,
  batchMatchKeys: Set<string>,
): boolean {
  if (batchSourceIds.has(doc.id)) return true;
  if (!batchMatchKeys.size) return false;

  const docKeys = documentMatchKeys(doc.title, doc.originalFilename);
  for (const key of docKeys) {
    if (batchMatchKeys.has(key)) return true;
  }
  return false;
}

function acceptedSourceTypeForId(
  sourceDocumentId: string,
  acceptedSources?: readonly AdminV3IngestAcceptedSource[],
): string | undefined {
  return acceptedSources?.find(
    (source) => source.source_document_id === sourceDocumentId,
  )?.source_type;
}

/** Map upload (including duplicate-reuse) sources into selection rows. */
export function selectedDocumentsFromUploadResponse(
  response: AdminV3IngestUploadResponse,
): SelectedIngestDocument[] {
  return selectedIngestDocumentsFromUploadResponse(response).slice(
    0,
    MAX_DOCUMENT_SELECTION,
  );
}

/**
 * Builds checkbox selection from source ids already available on the active
 * ingest session / batch — does not write session storage.
 */
export function selectedDocumentsFromIngestSourceIds(input: {
  previous?: readonly SelectedIngestDocument[];
  session?: ActiveIngestSession | null;
  keptExistingSources?: readonly KeptExistingIngestSource[];
  acceptedSources?: readonly AdminV3IngestAcceptedSource[];
  statusSources?: readonly AdminV3IngestBatchSourceStatus[];
}): SelectedIngestDocument[] {
  const batchSourceIds = collectBatchSourceDocumentIds(
    input.acceptedSources,
    input.statusSources,
  );
  const batchMatchKeys = collectBatchDocumentMatchKeys(
    input.acceptedSources,
    input.statusSources,
  );
  const hasActiveBatch = batchSourceIds.size > 0;
  const keptExistingSources =
    input.keptExistingSources ?? input.session?.kept_existing_sources ?? [];
  const keptExistingIds = new Set(
    keptExistingSources.map((source) => source.source_document_id),
  );

  const byId = new Map<string, SelectedIngestDocument>();

  for (const doc of input.previous ?? []) {
    if (isSupersededByActiveBatchSource(doc, batchSourceIds, batchMatchKeys)) {
      continue;
    }
    if (hasActiveBatch && !keptExistingIds.has(doc.id)) {
      continue;
    }
    upsertSelectedDocument(byId, doc);
  }

  const session = input.session ?? null;
  if (
    session?.source_document_id &&
    !hasActiveBatch &&
    !batchSourceIds.has(session.source_document_id)
  ) {
    upsertSelectedDocument(byId, {
      id: session.source_document_id,
      title: session.title?.trim() || session.source_document_id,
      originalFilename: null,
      sourceType: 'pdf',
      status: 'ingesting',
    });
  }

  for (const source of keptExistingSources) {
    upsertSelectedDocument(byId, {
      id: source.source_document_id,
      title:
        source.title?.trim() ||
        source.filename?.trim() ||
        source.source_document_id,
      originalFilename: source.filename?.trim() || null,
      sourceType: 'pdf',
      status: 'ingested',
    });
  }

  for (const source of input.acceptedSources ?? []) {
    if (!source.source_document_id) continue;
    upsertSelectedDocument(byId, {
      id: source.source_document_id,
      title: source.title?.trim() || source.source_document_id,
      originalFilename: source.title?.trim() || null,
      sourceType: source.source_type || 'pdf',
      status: 'ingesting',
    });
  }

  for (const source of input.statusSources ?? []) {
    if (!source.source_document_id) continue;
    upsertSelectedDocument(byId, {
      id: source.source_document_id,
      title: source.document_label?.trim() || source.source_document_id,
      originalFilename: source.document_label?.trim() || null,
      sourceType:
        acceptedSourceTypeForId(
          source.source_document_id,
          input.acceptedSources,
        ) || 'pdf',
      status: source.status || 'ingesting',
    });
  }

  return Array.from(byId.values()).slice(0, MAX_DOCUMENT_SELECTION);
}
