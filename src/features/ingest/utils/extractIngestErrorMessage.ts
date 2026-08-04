function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Extract a user-facing message from ingest pipeline error payloads. */
export function extractIngestErrorMessage(error: unknown): string | null {
  if (error == null) return null;

  if (typeof error === 'string') {
    const trimmed = error.trim();
    return trimmed || null;
  }

  if (!isRecord(error)) return null;

  const message = error.message;
  if (typeof message === 'string' && message.trim()) {
    return message.trim();
  }

  const detail = error.detail;
  if (typeof detail === 'string' && detail.trim()) {
    return detail.trim();
  }

  return null;
}
