import { baseApi } from '@/store/apis/base';

export type SourceDocumentStatus = 'ingesting' | 'ingested' | 'failed';

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
  original_filename: string | null;
  ingested_at: string;
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
  status?: SourceDocumentStatus;
  /** Repeated or comma-separated values are accepted by the backend. */
  source_type?: SourceDocumentSourceType | SourceDocumentSourceType[];
  /** Case-insensitive substring match on original_filename or title. */
  q?: string;
  limit?: number;
  offset?: number;
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
    original_filename:
      typeof item.original_filename === 'string'
        ? item.original_filename
        : null,
    ingested_at: typeof item.ingested_at === 'string' ? item.ingested_at : '',
  };
}

function toNonNegativeInteger(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
    ? value
    : fallback;
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
    }),
  }),
  overrideExisting: false,
});

export const { useFetchSourceDocumentsQuery } = adminSourceDocumentsApi;
