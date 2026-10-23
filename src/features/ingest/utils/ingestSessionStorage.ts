const ACTIVE_INGEST_SESSION_KEY = 'adminV3ActiveIngest';

export interface KeptExistingIngestSource {
  source_document_id: string;
  title?: string;
  filename?: string;
}

export interface ActiveIngestSession {
  batch_id: string;
  source_document_id?: string;
  title?: string;
  /** Sources kept as already ingested while another batch item is ingesting. */
  kept_existing_sources?: KeptExistingIngestSource[];
}

function isKeptExistingIngestSource(
  value: unknown,
): value is KeptExistingIngestSource {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.source_document_id === 'string';
}

function isActiveIngestSession(value: unknown): value is ActiveIngestSession {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  if (typeof record.batch_id !== 'string' || record.batch_id.length === 0) {
    return false;
  }
  if (record.kept_existing_sources === undefined) return true;
  if (!Array.isArray(record.kept_existing_sources)) return false;
  return record.kept_existing_sources.every(isKeptExistingIngestSource);
}

export function readActiveIngestSession(): ActiveIngestSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(ACTIVE_INGEST_SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isActiveIngestSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeActiveIngestSession(session: ActiveIngestSession): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(
    ACTIVE_INGEST_SESSION_KEY,
    JSON.stringify(session),
  );
}

export function clearActiveIngestSession(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(ACTIVE_INGEST_SESSION_KEY);
}

export function mergeKeptExistingIngestSources(
  current: readonly KeptExistingIngestSource[],
  incoming: readonly KeptExistingIngestSource[],
): KeptExistingIngestSource[] {
  const merged = new Map<string, KeptExistingIngestSource>();
  for (const source of [...current, ...incoming]) {
    const existing = merged.get(source.source_document_id);
    merged.set(source.source_document_id, {
      source_document_id: source.source_document_id,
      title: source.title ?? existing?.title,
      filename: source.filename ?? existing?.filename,
    });
  }
  return Array.from(merged.values());
}

export function readKeptExistingIngestSourceIds(
  session: ActiveIngestSession | null = readActiveIngestSession(),
): Set<string> {
  if (!session?.kept_existing_sources?.length) return new Set();
  return new Set(
    session.kept_existing_sources.map((source) => source.source_document_id),
  );
}
