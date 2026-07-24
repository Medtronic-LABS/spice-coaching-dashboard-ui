const RECENT_INGEST_DOCUMENTS_KEY = 'adminV3RecentIngestDocuments';
const MAX_RECENT_INGEST_DOCUMENTS = 25;

export interface RecentIngestDocument {
  source_document_id: string;
  title?: string;
  ingested_at: string;
}

function isRecentIngestDocument(value: unknown): value is RecentIngestDocument {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.source_document_id === 'string' &&
    typeof record.ingested_at === 'string'
  );
}

export function readRecentIngestDocuments(): RecentIngestDocument[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.sessionStorage.getItem(RECENT_INGEST_DOCUMENTS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecentIngestDocument);
  } catch {
    return [];
  }
}

export function appendRecentIngestDocument(
  document: RecentIngestDocument,
): void {
  if (typeof window === 'undefined') return;
  const existing = readRecentIngestDocuments().filter(
    (entry) => entry.source_document_id !== document.source_document_id,
  );
  const next = [document, ...existing].slice(0, MAX_RECENT_INGEST_DOCUMENTS);
  window.sessionStorage.setItem(
    RECENT_INGEST_DOCUMENTS_KEY,
    JSON.stringify(next),
  );
}
