function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readStringField(
  record: Record<string, unknown>,
  key: string,
): string | null {
  const value = record[key];
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return null;
}

/**
 * Reads nested `error` objects on source/batch rows.
 * User-facing copy is `message`; `detail` / `details` are technical fallbacks.
 */
function extractIngestErrorPayloadMessage(error: unknown): string | null {
  if (error == null) return null;

  if (typeof error === 'string') {
    const trimmed = error.trim();
    return trimmed || null;
  }

  if (!isRecord(error)) return null;

  const message = readStringField(error, 'message');
  if (message) return message;

  const details = readStringField(error, 'details');
  if (details) return details;

  const detail = readStringField(error, 'detail');
  if (detail) return detail;

  return null;
}

/**
 * Tooltip text for ingest failures.
 * - Pipeline nodes: top-level `error_message`, then nested `error.detail`.
 * - Source/batch rows: nested `error.message`, then nested `error.detail`.
 */
export function extractIngestFailureTooltipMessage(
  context: unknown,
): string | null {
  if (context == null) return null;

  if (isRecord(context)) {
    const nodeMessage = readStringField(context, 'error_message');
    if (nodeMessage) return nodeMessage;

    if ('error' in context) {
      return extractIngestErrorPayloadMessage(context.error);
    }
  }

  return extractIngestErrorPayloadMessage(context);
}

export function extractFirstIngestFailureTooltipMessage(
  contexts: unknown[],
): string | null {
  for (const context of contexts) {
    const message = extractIngestFailureTooltipMessage(context);
    if (message) return message;
  }
  return null;
}

/** Batch poll responses often keep `error: null` while failed sources carry the message. */
export function extractIngestBatchFailureTooltipMessage(
  batch: unknown,
): string | null {
  const direct = extractIngestFailureTooltipMessage(batch);
  if (direct) return direct;

  if (!isRecord(batch)) return null;
  const sources = batch.sources;
  if (!Array.isArray(sources)) return null;

  return extractFirstIngestFailureTooltipMessage(sources);
}

/** @deprecated Prefer extractIngestFailureTooltipMessage for pipeline rows. */
export function extractIngestErrorMessage(error: unknown): string | null {
  return extractIngestFailureTooltipMessage(error);
}

/** @deprecated Prefer extractFirstIngestFailureTooltipMessage for pipeline rows. */
export function extractFirstIngestErrorMessage(
  errors: unknown[],
): string | null {
  return extractFirstIngestFailureTooltipMessage(errors);
}
