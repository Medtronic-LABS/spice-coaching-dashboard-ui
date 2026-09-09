import {
  getApiErrorCatalogEntry,
  HTTP_STATUS_CATALOG_CODE,
} from '@/constants/apiErrorCatalog';

export const GENERIC_API_ERROR_DESCRIPTION =
  'Something went wrong. Please try again.';

export type ParsedApiError = {
  status: number | string;
  code: string | null;
  message: string | null;
  title: string;
  description: string;
  retryable: boolean;
  domain: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isSerializedFetchError(
  error: unknown,
): error is { status: number | string; data?: unknown } {
  return (
    isRecord(error) &&
    'status' in error &&
    (typeof error.status === 'number' || typeof error.status === 'string')
  );
}

function extractCodeAndMessage(data: unknown): {
  code: string | null;
  message: string | null;
} {
  if (!isRecord(data)) {
    return { code: null, message: null };
  }

  const topMessage = readString(data.message);
  const topCode = readString(data.code);
  const detail = data.detail;

  if (typeof detail === 'string') {
    return {
      code: topCode,
      message: readString(detail) ?? topMessage,
    };
  }

  if (isRecord(detail)) {
    return {
      code: readString(detail.code) ?? topCode,
      message: readString(detail.message) ?? topMessage,
    };
  }

  return { code: topCode, message: topMessage };
}

function unknownClientError(message: string | null): ParsedApiError {
  return {
    status: 'UNKNOWN',
    code: null,
    message,
    title: 'Something went wrong',
    description: message ?? GENERIC_API_ERROR_DESCRIPTION,
    retryable: false,
    domain: null,
  };
}

function resolveCatalogEntry(code: string | null, status: number | string) {
  if (code) {
    const byCode = getApiErrorCatalogEntry(code);
    if (byCode) return byCode;
  }

  if (typeof status === 'number') {
    const statusCode = HTTP_STATUS_CATALOG_CODE[status];
    if (statusCode) {
      return getApiErrorCatalogEntry(statusCode);
    }
  }

  return undefined;
}

/**
 * Normalizes RTK Query / fetch errors using the shared API error catalog.
 */
export function parseApiError(error: unknown): ParsedApiError {
  if (!isSerializedFetchError(error)) {
    if (error instanceof Error) {
      return unknownClientError(error.message);
    }
    if (typeof error === 'string') {
      return unknownClientError(error);
    }
    return unknownClientError(null);
  }

  const status = error.status;
  const { code, message } = extractCodeAndMessage(error.data);
  const catalogEntry = resolveCatalogEntry(code, status);

  const title =
    catalogEntry?.title ??
    (typeof status === 'number'
      ? `Request failed (${status})`
      : 'Request failed');
  const description =
    message ?? catalogEntry?.description ?? GENERIC_API_ERROR_DESCRIPTION;
  const retryable =
    catalogEntry?.retryable ??
    (typeof status === 'number' && status >= 500 && status !== 501);

  return {
    status,
    code,
    message,
    title,
    description,
    retryable,
    domain: catalogEntry?.domain ?? null,
  };
}
