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

export function formatRtkQueryError(error: unknown): string {
  if (isSerializedError(error)) {
    const data = error.data;
    if (
      typeof data === 'object' &&
      data &&
      'message' in data &&
      typeof (data as { message: unknown }).message === 'string'
    ) {
      return (data as { message: string }).message;
    }
    return `Request failed (${String(error.status)})`;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}
