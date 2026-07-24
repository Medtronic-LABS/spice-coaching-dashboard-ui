function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSerializedError(
  error: unknown,
): error is { status: string | number; data?: unknown } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (typeof (error as { status: unknown }).status === 'number' ||
      typeof (error as { status: unknown }).status === 'string')
  );
}

function messageFromData(data: unknown): string | null {
  if (!isRecord(data)) return null;
  if (typeof data.message === 'string' && data.message.length > 0) {
    return data.message;
  }
  const detail = data.detail;
  if (typeof detail === 'string' && detail.length > 0) {
    return detail;
  }
  if (isRecord(detail) && typeof detail.message === 'string') {
    return detail.message;
  }
  return null;
}

export function formatRtkQueryError(error: unknown): string {
  if (isSerializedError(error)) {
    const fromData = messageFromData(error.data);
    if (fromData) return fromData;
    return `Request failed (${String(error.status)})`;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}
