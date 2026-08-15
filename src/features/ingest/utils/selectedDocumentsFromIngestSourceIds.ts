import type {
  AdminV3IngestAcceptedSource,
  AdminV3IngestBatchSourceStatus,
} from '@/features/ingest/api/adminIngestApi';
import { MAX_DOCUMENT_SELECTION } from '@/features/ingest/constants/documentSelection';
import type { SelectedIngestDocument } from '@/features/ingest/types/documentSelection.types';
import type {
  ActiveIngestSession,
  KeptExistingIngestSource,
} from '@/features/ingest/utils/ingestSessionStorage';

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
  });
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
  const byId = new Map<string, SelectedIngestDocument>();

  for (const doc of input.previous ?? []) {
    upsertSelectedDocument(byId, doc);
  }

  const session = input.session ?? null;
  if (session?.source_document_id) {
    upsertSelectedDocument(byId, {
      id: session.source_document_id,
      title: session.title?.trim() || session.source_document_id,
      originalFilename: null,
      sourceType: 'pdf',
      status: 'ingesting',
    });
  }

  for (const source of input.keptExistingSources ??
    session?.kept_existing_sources ??
    []) {
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
      sourceType: 'pdf',
      status: source.status || 'ingesting',
    });
  }

  return Array.from(byId.values()).slice(0, MAX_DOCUMENT_SELECTION);
}
