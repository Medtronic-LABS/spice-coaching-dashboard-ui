function normalizeIngestStatus(status: string | undefined): string {
  return (status ?? '').toLowerCase();
}

export function isTerminalIngestStatus(status: string | undefined): boolean {
  const s = normalizeIngestStatus(status);
  return (
    s === 'succeeded' ||
    s.includes('fail') ||
    s.includes('error') ||
    s.includes('cancel') ||
    s.includes('complete')
  );
}

export function isIngestSucceeded(status: string | undefined): boolean {
  return normalizeIngestStatus(status) === 'succeeded';
}

export function isIngestRunning(status: string | undefined): boolean {
  const s = normalizeIngestStatus(status);
  return s === 'running' || s.endsWith('_running');
}

export function isIngestInProgress(
  sourceDocumentId: string,
  status: string | undefined,
): boolean {
  if (!sourceDocumentId) return false;
  if (!status) return true;
  if (isIngestRunning(status)) return true;
  const s = normalizeIngestStatus(status);
  if (s === 'pipeline_queued' || s === 'queued' || s === 'pending') {
    return true;
  }
  return !isTerminalIngestStatus(status);
}

export function shouldPollIngestStatus(
  sourceDocumentId: string,
  status: string | undefined,
): boolean {
  if (!sourceDocumentId) return false;
  if (!status) return true;
  return !isTerminalIngestStatus(status);
}
