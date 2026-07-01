import { useGetAdminFilePresignedUrlQuery } from '@/features/module-library/api/adminFilesApi';
import { objectNameFromUploadedFileUrl } from '@/features/module-library/utils/uploadedFileUrl';

export interface UsePresignedFileUrlOptions {
  expiresSeconds?: number;
  disposition?: 'auto' | 'inline' | 'attachment';
  /** Legacy admin files URL used to derive `object_name` for presigned fetch. */
  legacyUrl?: string;
}

export function usePresignedFileUrl(
  objectName: string | null | undefined,
  options: UsePresignedFileUrlOptions = {},
) {
  const resolvedObjectName =
    objectName?.trim() ||
    (options.legacyUrl
      ? objectNameFromUploadedFileUrl(options.legacyUrl)
      : null) ||
    null;

  const { data, isLoading, isFetching, isError, error } =
    useGetAdminFilePresignedUrlQuery(
      {
        object_name: resolvedObjectName ?? '',
        expires_seconds: options.expiresSeconds ?? 600,
        disposition: options.disposition ?? 'auto',
      },
      { skip: !resolvedObjectName },
    );

  const presignedUrl = data?.presigned_url ?? null;
  const waitingForPresigned =
    Boolean(resolvedObjectName) && !presignedUrl && (isLoading || isFetching);

  return {
    objectName: resolvedObjectName,
    /** Presigned URL only — never a direct admin files URL. */
    url: presignedUrl,
    isLoading: waitingForPresigned,
    isError: Boolean(resolvedObjectName) && isError && !presignedUrl,
    error,
  };
}
