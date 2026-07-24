import type { AdminFilePresignedUrlResponse } from '@/features/modules/api/adminFilesApi';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Normalize presigned-url API payloads (`presigned_url`, `url`, or raw string). */
export function normalizePresignedFileUrlResponse(
  response: unknown,
): AdminFilePresignedUrlResponse {
  if (typeof response === 'string' && response.trim()) {
    return { presigned_url: response.trim() };
  }

  if (isPlainObject(response)) {
    const presigned_url =
      response.presigned_url ?? response.url ?? response.signed_url;
    if (typeof presigned_url === 'string' && presigned_url.trim()) {
      return {
        presigned_url: presigned_url.trim(),
        expires_seconds:
          typeof response.expires_seconds === 'number'
            ? response.expires_seconds
            : undefined,
      };
    }
  }

  throw new Error('Invalid presigned URL response from files API');
}
