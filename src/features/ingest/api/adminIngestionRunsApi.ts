import { baseApi } from '@/store/apis/base';

export interface IngestionRunSummary {
  id: string;
  source_document_id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  error: Record<string, unknown> | null;
  document_label: string;
  generated_card_count: number;
  generated_quiz_count: number;
  generated_module_count: number;
}

export interface IngestionRunListResponse {
  runs: IngestionRunSummary[];
  total_runs: number;
  total_pages: number;
  limit: number;
  offset: number;
  has_next_page: boolean;
}

export interface FetchIngestionRunsQueryArgs {
  status?: string;
  limit?: number;
  offset?: number;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function normalizeIngestionRunSummary(
  item: Record<string, unknown>,
): IngestionRunSummary {
  const id = item.id;
  const sourceDocumentId = item.source_document_id;
  const documentLabel =
    typeof item.document_label === 'string' ? item.document_label.trim() : '';

  return {
    id: typeof id === 'string' || typeof id === 'number' ? String(id) : '',
    source_document_id:
      typeof sourceDocumentId === 'string' ||
      typeof sourceDocumentId === 'number'
        ? String(sourceDocumentId)
        : '',
    status: typeof item.status === 'string' ? item.status : '',
    started_at: typeof item.started_at === 'string' ? item.started_at : '',
    completed_at:
      typeof item.completed_at === 'string' ? item.completed_at : null,
    error: isPlainObject(item.error) ? item.error : null,
    document_label: documentLabel,
    generated_card_count: normalizeCount(item.generated_card_count),
    generated_quiz_count: normalizeCount(item.generated_quiz_count),
    generated_module_count: normalizeCount(item.generated_module_count),
  };
}

function normalizeIngestionRunListResponse(
  response: unknown,
  args: FetchIngestionRunsQueryArgs,
): IngestionRunListResponse {
  const limit = args.limit ?? 50;
  const offset = args.offset ?? 0;

  if (!isPlainObject(response)) {
    return {
      runs: [],
      total_runs: 0,
      total_pages: 0,
      limit,
      offset,
      has_next_page: false,
    };
  }

  const runs = Array.isArray(response.runs)
    ? response.runs
        .filter(isPlainObject)
        .map((item) => normalizeIngestionRunSummary(item))
    : [];

  const responseLimit =
    typeof response.limit === 'number' && Number.isFinite(response.limit)
      ? Math.max(1, response.limit)
      : limit;
  const responseOffset =
    typeof response.offset === 'number' && Number.isFinite(response.offset)
      ? Math.max(0, response.offset)
      : offset;

  const totalRuns =
    typeof response.total_runs === 'number' &&
    Number.isFinite(response.total_runs)
      ? Math.max(0, response.total_runs)
      : runs.length;

  const totalPages =
    typeof response.total_pages === 'number' &&
    Number.isFinite(response.total_pages)
      ? Math.max(0, response.total_pages)
      : responseLimit > 0
        ? Math.ceil(totalRuns / responseLimit)
        : 0;

  return {
    runs,
    total_runs: totalRuns,
    total_pages: totalPages,
    limit: responseLimit,
    offset: responseOffset,
    has_next_page: responseOffset + runs.length < totalRuns,
  };
}

export const adminIngestionRunsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    fetchIngestionRuns: builder.query<
      IngestionRunListResponse,
      FetchIngestionRunsQueryArgs
    >({
      query: ({ limit, offset, status }) => ({
        url: '/admin/ingestion-runs',
        method: 'GET',
        params: {
          limit,
          offset,
          ...(status ? { status } : {}),
        },
      }),
      transformResponse: (response: unknown, _meta, arg) =>
        normalizeIngestionRunListResponse(response, arg),
    }),
  }),
  overrideExisting: false,
});

export const { useFetchIngestionRunsQuery } = adminIngestionRunsApi;
