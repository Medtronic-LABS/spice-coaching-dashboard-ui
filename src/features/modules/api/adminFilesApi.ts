import { baseApi } from '@/store/apis/base';
import type { RichStoredFileAttrs } from '@/features/modules/types/richText.types';
import { normalizePresignedFileUrlResponse } from '@/features/modules/utils/presignedFileUrlResponse';

export interface AdminFileUploadResponse {
  bucket_name: string;
  object_name: string;
  storage_path: string;
  content_type: string;
  size_bytes: number;
  original_filename: string;
}

export interface AdminFileUploadRequest {
  file: File;
  /** Defaults to `media` for module attachments. */
  prefix?: string;
}

export interface AdminFilePresignedUrlParams {
  object_name: string;
  expires_seconds?: number;
  disposition?: 'auto' | 'inline' | 'attachment';
}

export interface AdminFilePresignedUrlResponse {
  presigned_url: string;
  expires_seconds?: number;
}

export function storedFileAttrsFromUpload(
  response: AdminFileUploadResponse,
): RichStoredFileAttrs {
  return {
    object_name: response.object_name,
    content_type: response.content_type,
    original_filename: response.original_filename,
  };
}

export const adminFilesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    uploadAdminFile: builder.mutation<
      AdminFileUploadResponse,
      AdminFileUploadRequest
    >({
      query: ({ file, prefix = 'media' }) => {
        const form = new FormData();
        form.append('file', file, file.name);
        form.append('prefix', prefix);
        return {
          url: '/admin/files',
          method: 'POST',
          body: form,
        };
      },
    }),
    getAdminFilePresignedUrl: builder.query<
      AdminFilePresignedUrlResponse,
      AdminFilePresignedUrlParams
    >({
      query: ({
        object_name,
        expires_seconds = 600,
        disposition = 'auto',
      }) => ({
        url: '/admin/files/presigned-url',
        params: { object_name, expires_seconds, disposition },
      }),
      transformResponse: (response: unknown) =>
        normalizePresignedFileUrlResponse(response),
    }),
  }),
  overrideExisting: false,
});

export const {
  useUploadAdminFileMutation,
  useGetAdminFilePresignedUrlQuery,
  useLazyGetAdminFilePresignedUrlQuery,
} = adminFilesApi;
