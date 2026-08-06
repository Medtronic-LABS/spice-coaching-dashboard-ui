import type { KnowledgeLibraryItem } from '@/features/modules/types/knowledgeLibrary.types';
import { baseApi } from '@/store/apis/base';

export type SourceDocumentStatus =
  | 'uploaded'
  | 'ingesting'
  | 'ingested'
  | 'failed'
  | 'retired';

export type SourceDocumentSourceType =
  | 'pdf'
  | 'pptx'
  | 'docx'
  | 'audio'
  | 'video';

export interface SourceDocumentSummary {
  id: string;
  title: string;
  source_type: string;
  status: string;
  content_domain: string;
  authority_label: string;
  stored_path: string;
  original_filename: string | null;
  description: string | null;
  thumbnail_storage_path: string | null;
  thumbnail_presigned_url?: string | null;
  uploaded_date: string;
  ingested_at: string;
  updated_at: string;
  uploaded_by: string | null;
  assigned: boolean;
  sync_published_visible?: boolean;
}

/** Paginated envelope returned by `GET /admin/source-documents`. */
export interface SourceDocumentListResponse {
  source_documents: SourceDocumentSummary[];
  total_source_documents: number;
  total_pages: number;
  limit: number;
  offset: number;
}

export interface FetchSourceDocumentsParams {
  /** Repeated or comma-separated values are accepted by the backend. */
  status?: SourceDocumentStatus | SourceDocumentStatus[];
  /** Repeated or comma-separated values are accepted by the backend. */
  source_type?: SourceDocumentSourceType | SourceDocumentSourceType[];
  /** `true` = knowledge docs, `false` = ingest docs. */
  sync_published_visible?: boolean;
  /** Case-insensitive substring match on original_filename or title. */
  q?: string;
  uploaded_from?: string;
  uploaded_to?: string;
  uploaded_by?: string;
  assigned?: boolean;
  ingested?: boolean;
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}

export interface UpdateSourceDocumentMetadataRequest {
  title?: string;
  description?: string | null;
}

export interface UpdateSourceDocumentThumbnailRequest {
  sourceDocumentId: string;
  file: File;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeSourceDocumentSummary(
  item: Record<string, unknown>,
): SourceDocumentSummary {
  return {
    id: String(item.id ?? ''),
    title: typeof item.title === 'string' ? item.title : '',
    source_type: typeof item.source_type === 'string' ? item.source_type : '',
    status: typeof item.status === 'string' ? item.status : '',
    content_domain:
      typeof item.content_domain === 'string' ? item.content_domain : '',
    authority_label:
      typeof item.authority_label === 'string' ? item.authority_label : '',
    stored_path: typeof item.stored_path === 'string' ? item.stored_path : '',
    original_filename:
      typeof item.original_filename === 'string'
        ? item.original_filename
        : null,
    description: typeof item.description === 'string' ? item.description : null,
    thumbnail_storage_path:
      typeof item.thumbnail_storage_path === 'string'
        ? item.thumbnail_storage_path
        : null,
    thumbnail_presigned_url:
      typeof item.thumbnail_presigned_url === 'string'
        ? item.thumbnail_presigned_url
        : null,
    uploaded_date:
      typeof item.uploaded_date === 'string'
        ? item.uploaded_date
        : typeof item.ingested_at === 'string'
          ? item.ingested_at
          : '',
    ingested_at: typeof item.ingested_at === 'string' ? item.ingested_at : '',
    updated_at:
      typeof item.updated_at === 'string'
        ? item.updated_at
        : typeof item.uploaded_date === 'string'
          ? item.uploaded_date
          : typeof item.ingested_at === 'string'
            ? item.ingested_at
            : '',
    uploaded_by: typeof item.uploaded_by === 'string' ? item.uploaded_by : null,
    assigned: item.assigned === true,
    sync_published_visible:
      typeof item.sync_published_visible === 'boolean'
        ? item.sync_published_visible
        : undefined,
  };
}

function toNonNegativeInteger(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
    ? value
    : fallback;
}

export function mapSourceDocumentToKnowledgeItem(
  doc: SourceDocumentSummary,
): KnowledgeLibraryItem {
  return {
    id: doc.id,
    title: doc.title,
    fileType: 'pdf',
    storedPath: doc.stored_path,
    originalFilename: doc.original_filename,
    thumbnailStoragePath: doc.thumbnail_storage_path,
    uploadedAt: doc.uploaded_date || doc.ingested_at,
    updatedAt: doc.updated_at || doc.uploaded_date || doc.ingested_at,
    uploadedBy: doc.uploaded_by,
    assigned: doc.assigned,
    ingested: doc.status === 'ingested',
    status: doc.status,
    description: doc.description,
  };
}

export const adminSourceDocumentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    fetchSourceDocuments: builder.query<
      SourceDocumentListResponse,
      FetchSourceDocumentsParams | void
    >({
      query: (params) => ({
        url: '/admin/source-documents',
        method: 'GET',
        params: params ?? undefined,
      }),
      transformResponse: (response: unknown): SourceDocumentListResponse => {
        if (!isPlainObject(response)) {
          return {
            source_documents: [],
            total_source_documents: 0,
            total_pages: 0,
            limit: 0,
            offset: 0,
          };
        }
        const documents = Array.isArray(response.source_documents)
          ? response.source_documents
              .filter(isPlainObject)
              .map((item) => normalizeSourceDocumentSummary(item))
          : [];
        return {
          source_documents: documents,
          total_source_documents: toNonNegativeInteger(
            response.total_source_documents,
            documents.length,
          ),
          total_pages: toNonNegativeInteger(
            response.total_pages,
            documents.length ? 1 : 0,
          ),
          limit: toNonNegativeInteger(response.limit, documents.length),
          offset: toNonNegativeInteger(response.offset, 0),
        };
      },
      providesTags: ['SourceDocuments'],
    }),
    updateSourceDocumentMetadata: builder.mutation<
      SourceDocumentSummary,
      { sourceDocumentId: string; body: UpdateSourceDocumentMetadataRequest }
    >({
      query: ({ sourceDocumentId, body }) => ({
        url: `/admin/source-documents/${encodeURIComponent(sourceDocumentId)}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (response: unknown): SourceDocumentSummary => {
        if (!isPlainObject(response)) {
          return normalizeSourceDocumentSummary({});
        }
        return normalizeSourceDocumentSummary(response);
      },
      invalidatesTags: ['SourceDocuments'],
    }),
    updateSourceDocumentThumbnail: builder.mutation<
      SourceDocumentSummary,
      UpdateSourceDocumentThumbnailRequest
    >({
      query: ({ sourceDocumentId, file }) => {
        const form = new FormData();
        form.append('file', file, file.name);
        return {
          url: `/admin/source-documents/${encodeURIComponent(sourceDocumentId)}/thumbnail`,
          method: 'PUT',
          body: form,
        };
      },
      transformResponse: (response: unknown): SourceDocumentSummary => {
        if (!isPlainObject(response)) {
          return normalizeSourceDocumentSummary({});
        }
        return normalizeSourceDocumentSummary(response);
      },
      invalidatesTags: ['SourceDocuments'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useFetchSourceDocumentsQuery,
  useUpdateSourceDocumentMetadataMutation,
  useUpdateSourceDocumentThumbnailMutation,
} = adminSourceDocumentsApi;
