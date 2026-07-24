import type { AdminV3IngestAcceptedSource } from '@/features/ingest/api/adminIngestApi';
import { isTerminalIngestStatus } from '@/features/ingest/utils/ingestStatus';

const ACTIVE_VIDEO_INGEST_SESSIONS_KEY = 'adminV3ActiveVideoIngests';

export interface ActiveVideoIngestSession {
  source_document_id: string;
  title?: string;
}

function isActiveVideoIngestSession(
  value: unknown,
): value is ActiveVideoIngestSession {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.source_document_id === 'string';
}

export function readActiveVideoIngestSessions(): ActiveVideoIngestSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.sessionStorage.getItem(ACTIVE_VIDEO_INGEST_SESSIONS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isActiveVideoIngestSession);
  } catch {
    return [];
  }
}

export function writeActiveVideoIngestSessions(
  sessions: ActiveVideoIngestSession[],
): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(
    ACTIVE_VIDEO_INGEST_SESSIONS_KEY,
    JSON.stringify(sessions),
  );
}

export function clearActiveVideoIngestSessions(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(ACTIVE_VIDEO_INGEST_SESSIONS_KEY);
}

export function mergeActiveVideoIngestSessions(
  sources: AdminV3IngestAcceptedSource[],
): ActiveVideoIngestSession[] {
  const merged = new Map(
    readActiveVideoIngestSessions().map((session) => [
      session.source_document_id,
      session,
    ]),
  );
  for (const source of sources) {
    merged.set(source.source_document_id, {
      source_document_id: source.source_document_id,
      title: source.title,
    });
  }
  const sessions = [...merged.values()];
  writeActiveVideoIngestSessions(sessions);
  return sessions;
}

export function pruneActiveVideoIngestSession(
  sourceDocumentId: string,
  status: string | undefined,
): ActiveVideoIngestSession[] {
  const sessions = readActiveVideoIngestSessions();
  if (!sourceDocumentId || !isTerminalIngestStatus(status)) return sessions;
  const next = sessions.filter(
    (session) => session.source_document_id !== sourceDocumentId,
  );
  if (next.length) {
    writeActiveVideoIngestSessions(next);
  } else {
    clearActiveVideoIngestSessions();
  }
  return next;
}
