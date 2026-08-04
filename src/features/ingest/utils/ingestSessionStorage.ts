const ACTIVE_INGEST_SESSION_KEY = 'adminV3ActiveIngest';

export interface ActiveIngestSession {
  batch_id: string;
  source_document_id?: string;
  title?: string;
}

function isActiveIngestSession(value: unknown): value is ActiveIngestSession {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.batch_id === 'string' && record.batch_id.length > 0;
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
