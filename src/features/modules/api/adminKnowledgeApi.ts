import { baseApi } from '@/store/apis/base';

export interface KnowledgeSplitInput {
  title: string;
  start_page: number;
  end_page: number;
  thumbnail_storage_path?: string | null;
}

export interface KnowledgeUploadPayload {
  file: File;
  /** Whole-file mode only. */
  title?: string;
  /** Whole-file mode only; from a prior `POST /admin/files`. */
  thumbnailStoragePath?: string | null;
  /** When present and non-empty, backend physically splits the PDF. */
  splits?: KnowledgeSplitInput[];
}

export interface KnowledgeUploadedSource {
  source_document_id: string;
  title: string;
  stored_path: string;
  thumbnail_storage_path: string | null;
  start_page: number | null;
  end_page: number | null;
}

export interface KnowledgeUploadResponse {
  sources: KnowledgeUploadedSource[];
}

export interface KnowledgeUploader {
  value: string;
  label: string;
}

export interface KnowledgeUploadersResponse {
  uploaders: KnowledgeUploader[];
}

export interface FetchKnowledgeUploadersParams {
  q?: string;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function toOptionalInt(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalizeUploadedSource(
  item: Record<string, unknown>,
): KnowledgeUploadedSource {
  return {
    source_document_id: String(item.source_document_id ?? ''),
    title: typeof item.title === 'string' ? item.title : '',
    stored_path: typeof item.stored_path === 'string' ? item.stored_path : '',
    thumbnail_storage_path:
      typeof item.thumbnail_storage_path === 'string'
        ? item.thumbnail_storage_path
        : null,
    start_page: toOptionalInt(item.start_page),
    end_page: toOptionalInt(item.end_page),
  };
}

export const adminKnowledgeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    uploadKnowledgeDocument: builder.mutation<
      KnowledgeUploadResponse,
      KnowledgeUploadPayload
    >({
      query: (payload) => {
        const form = new FormData();
        form.append('file', payload.file, payload.file.name);
        if (payload.title?.trim()) {
          form.append('title', payload.title.trim());
        }
        if (payload.thumbnailStoragePath?.trim()) {
          form.append(
            'thumbnail_storage_path',
            payload.thumbnailStoragePath.trim(),
          );
        }
        if (payload.splits?.length) {
          form.append('splits', JSON.stringify(payload.splits));
        }
        return {
          url: '/admin/knowledge/upload',
          method: 'POST',
          body: form,
        };
      },
      transformResponse: (response: unknown): KnowledgeUploadResponse => {
        if (!isPlainObject(response) || !Array.isArray(response.sources)) {
          return { sources: [] };
        }
        return {
          sources: response.sources
            .filter(isPlainObject)
            .map(normalizeUploadedSource),
        };
      },
      invalidatesTags: ['SourceDocuments'],
    }),

    retireKnowledgeDocument: builder.mutation<void, string>({
      query: (sourceDocumentId) => ({
        url: `/admin/knowledge/${encodeURIComponent(sourceDocumentId)}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SourceDocuments'],
    }),

    fetchKnowledgeUploaders: builder.query<
      KnowledgeUploadersResponse,
      FetchKnowledgeUploadersParams | void
    >({
      query: (params) => ({
        url: '/admin/knowledge/uploaders',
        method: 'GET',
        params: params ?? undefined,
      }),
      transformResponse: (response: unknown): KnowledgeUploadersResponse => {
        if (!isPlainObject(response) || !Array.isArray(response.uploaders)) {
          return { uploaders: [] };
        }
        return {
          uploaders: response.uploaders.flatMap((item) => {
            if (!isPlainObject(item) || typeof item.value !== 'string') {
              return [];
            }
            return [
              {
                value: item.value,
                label: typeof item.label === 'string' ? item.label : item.value,
              },
            ];
          }),
        };
      },
    }),
  }),
  overrideExisting: false,
});

export const {
  useUploadKnowledgeDocumentMutation,
  useRetireKnowledgeDocumentMutation,
  useFetchKnowledgeUploadersQuery,
} = adminKnowledgeApi;
