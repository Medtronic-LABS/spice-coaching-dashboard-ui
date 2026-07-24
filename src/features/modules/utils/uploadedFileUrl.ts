import type { AdminFileUploadResponse } from '@/features/modules/api/adminFilesApi';
import { apiBaseUrl } from '@/store/apis/base';

const ADMIN_FILES_PATH = '/admin/files/';

/** Legacy direct URL for an uploaded object (prefer presigned URL + `object_name`). */
export function uploadedFileUrl(objectName: string): string {
  const encoded = objectName
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `${apiBaseUrl}${ADMIN_FILES_PATH}${encoded}`;
}

export function uploadedFileUrlFromResponse(
  response: AdminFileUploadResponse,
): string {
  return uploadedFileUrl(response.object_name);
}

/** Extract object key from a legacy admin files URL, if present. */
export function objectNameFromUploadedFileUrl(url: string): string | null {
  const prefix = `${apiBaseUrl}${ADMIN_FILES_PATH}`;
  if (!url.startsWith(prefix)) return null;
  try {
    return decodeURIComponent(url.slice(prefix.length));
  } catch {
    return null;
  }
}

export function hasStoredFileReference(
  attrs: { object_name?: string; url?: string } | undefined,
): boolean {
  return Boolean(attrs?.object_name?.trim() || attrs?.url?.trim());
}
