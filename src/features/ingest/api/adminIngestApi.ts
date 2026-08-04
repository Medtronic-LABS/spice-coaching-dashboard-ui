import { baseApi } from '@/store/apis/base';

export type IngestSourceType = 'pdf' | 'pptx' | 'docx' | 'audio' | 'video';

/** Includes client-integration domains plus module-assignment `operational`. */
export type IngestContentDomain =
  | 'digital'
  | 'clinical'
  | 'clinical_with_app_workflows'
  | 'operational';

export type IngestAssessmentMode = 'with_quiz' | 'read_only';

export type IngestBatchMode = 'append' | 'new';

export interface ExistingIngestedSourceSummary {
  source_document_id: string;
  title: string;
  original_filename: string | null;
  ingested_at: string;
  status: string;
}

export interface IngestDuplicateConflict {
  filename: string;
  title: string;
  content_sha256: string;
  existing_source_documents: ExistingIngestedSourceSummary[];
}

export interface IngestDuplicateErrorDetail {
  code: 'duplicate_content';
  message: string;
  conflicts: IngestDuplicateConflict[];
}

/** Legacy single-shot multipart POST /admin/ingest (client-integration). */
export interface AdminV3IngestBatchFormPayload {
  files: File[];
  fuse_sources?: boolean;
  /**
   * Must be aligned to the multipart `files` order.
   */
  sync_published_visible?: boolean[];
  content_domain?: IngestContentDomain;
  assessment_mode?: IngestAssessmentMode;
  quizzes_per_module?: number;
  cards_per_module?: number;
  mode?: IngestBatchMode;
  ingestion_instructions?: string | null;
  override_duplicates?: boolean[];
}

/** POST /admin/ingest/upload (multipart) — module-assignment two-step flow. */
export interface AdminV3IngestUploadPayload {
  files: File[];
  titles?: string[];
  /** Parallel to `files`; use `null` entries to omit a description. */
  descriptions?: Array<string | null>;
  content_domains?: IngestContentDomain[];
  sync_published_visible?: boolean[];
  override_duplicates?: boolean[];
}

export interface AdminV3IngestUploadedSource {
  source_document_id: string;
  title: string;
  source_type: IngestSourceType;
  stored_path: string;
  content_domain?: IngestContentDomain | null;
  status: string;
}

export interface AdminV3IngestUploadResponse {
  status: 'uploaded';
  sources: AdminV3IngestUploadedSource[];
  skipped_duplicates?: IngestDuplicateConflict[];
}

/** POST /admin/ingest (JSON) — start batch after upload. */
export interface AdminV3IngestStartPayload {
  source_document_ids: string[];
  assessment_mode?: IngestAssessmentMode;
  ingestion_instructions?: string | null;
  cards_per_module?: number | null;
  quizzes_per_module?: number | null;
  override_duplicates?: boolean[] | null;
}

export interface AdminV3IngestAcceptedSource {
  source_document_id: string;
  run_id?: string;
  title: string;
  source_type: IngestSourceType;
  stored_path: string;
  /** @deprecated Prefer batch poll_url on the accepted response. */
  poll_url?: string;
}

export interface AdminV3IngestAcceptedResponse {
  status: 'batch_queued';
  batch_id?: string;
  poll_url?: string;
  fuse_sources?: boolean;
  mode?: IngestBatchMode;
  modules_retired?: number;
  sources: AdminV3IngestAcceptedSource[];
  skipped_duplicates?: IngestDuplicateConflict[];
  note?: string | null;
}

export interface AdminV3IngestBatchNode {
  key: string;
  title: string;
  description?: string | null;
  status: string;
  started_at?: string | null;
  completed_at?: string | null;
  error?: unknown;
  activity?: unknown;
  candidate_id?: string | null;
  chunk_id?: string | null;
  proposed_title?: string | null;
  fusion?: unknown;
  published_module_merge?: unknown;
  input_summary?: Record<string, unknown> | null;
  output_summary?: Record<string, unknown> | null;
  children?: AdminV3IngestBatchNode[];
}

export interface AdminV3IngestBatchSourceStatus {
  source_document_id: string;
  run_id: string;
  document_label: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  error: unknown;
  nodes: AdminV3IngestBatchNode[];
}

export type IngestMergeDecisionChoice = 'accept_merge' | 'force_create';

/** Pending (or recently decided) merge row from batch poll `merge_decisions[]`. */
export interface AdminV3IngestMergeDecision {
  decision_url: string;
  run_id: string;
  candidate_id: string;
  decision?: IngestMergeDecisionChoice | string | null;
  module_title?: string | null;
  proposed_title?: string | null;
  matched_module_title?: string | null;
  title?: string | null;
  proposed_module_id?: string | null;
  matched_module_id?: string | null;
  published_module_id?: string | null;
  existing_module_id?: string | null;
  module_id?: string | null;
}

export interface AdminV3IngestMergeDecisionPayload {
  run_id: string;
  candidate_id: string;
  decision: IngestMergeDecisionChoice;
}

export interface AdminV3IngestMergeDecisionResponse {
  status?: string | null;
  detail?: string | null;
  message?: string | null;
}

export interface AdminV3IngestBatchStatusResponse {
  batch_id: string;
  status: string;
  created_at: string | null;
  completed_at: string | null;
  error: unknown;
  sources: AdminV3IngestBatchSourceStatus[];
  fusion?: unknown;
  retry_url?: string | null;
  merge_decisions?: AdminV3IngestMergeDecision[];
}

export interface AdminV3IngestStep {
  stage: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  input_summary: Record<string, unknown> | null;
  output_summary: Record<string, unknown> | null;
  error: Record<string, unknown> | null;
}

export interface AdminV3IngestCandidate {
  candidate_id: string;
  proposed_title: string;
  behavioural_gap_code: string;
  proposed_module_type: string;
  estimated_card_count: number;
  estimated_quiz_count: number;
  quality_flags: Record<string, unknown> | null;
}

export interface AdminV3IngestStatusResponse {
  run_id: string;
  source_document_id: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  error: unknown;
  generated_module_count?: number;
  generated_card_count?: number;
  generated_quiz_count?: number;
  steps: AdminV3IngestStep[];
  candidates: AdminV3IngestCandidate[];
}

export const adminIngestApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    ingestDocuments: builder.mutation<
      AdminV3IngestAcceptedResponse,
      AdminV3IngestBatchFormPayload
    >({
      query: (payload) => {
        const form = new FormData();
        for (const file of payload.files) {
          form.append('files', file, file.name);
        }
        if (typeof payload.fuse_sources === 'boolean') {
          form.append('fuse_sources', String(payload.fuse_sources));
        }
        if (payload.sync_published_visible?.length) {
          form.append(
            'sync_published_visible',
            JSON.stringify(payload.sync_published_visible),
          );
        }
        if (payload.content_domain) {
          form.append('content_domain', payload.content_domain);
        }
        if (payload.assessment_mode) {
          form.append('assessment_mode', payload.assessment_mode);
        }
        if (typeof payload.quizzes_per_module === 'number') {
          form.append('quizzes_per_module', String(payload.quizzes_per_module));
        }
        if (typeof payload.cards_per_module === 'number') {
          form.append('cards_per_module', String(payload.cards_per_module));
        }
        if (payload.mode) {
          form.append('mode', payload.mode);
        }
        if (payload.ingestion_instructions?.trim()) {
          form.append(
            'ingestion_instructions',
            payload.ingestion_instructions.trim(),
          );
        }
        if (payload.override_duplicates?.length) {
          form.append(
            'override_duplicates',
            JSON.stringify(payload.override_duplicates),
          );
        }
        return {
          url: '/admin/ingest',
          method: 'POST',
          body: form,
        };
      },
    }),
    uploadIngestFiles: builder.mutation<
      AdminV3IngestUploadResponse,
      AdminV3IngestUploadPayload
    >({
      query: (payload) => {
        const form = new FormData();
        for (const file of payload.files) {
          form.append('files', file, file.name);
        }
        if (payload.titles?.length) {
          form.append('titles', JSON.stringify(payload.titles));
        }
        if (payload.descriptions?.length) {
          form.append('descriptions', JSON.stringify(payload.descriptions));
        }
        if (payload.content_domains?.length) {
          form.append(
            'content_domains',
            JSON.stringify(payload.content_domains),
          );
        }
        if (payload.sync_published_visible?.length) {
          form.append(
            'sync_published_visible',
            JSON.stringify(payload.sync_published_visible),
          );
        }
        if (payload.override_duplicates?.length) {
          form.append(
            'override_duplicates',
            JSON.stringify(payload.override_duplicates),
          );
        }
        return {
          url: '/admin/ingest/upload',
          method: 'POST',
          body: form,
        };
      },
    }),
    startIngestBatch: builder.mutation<
      AdminV3IngestAcceptedResponse,
      AdminV3IngestStartPayload
    >({
      query: (payload) => ({
        url: '/admin/ingest',
        method: 'POST',
        body: {
          source_document_ids: payload.source_document_ids,
          assessment_mode: payload.assessment_mode ?? null,
          ingestion_instructions: payload.ingestion_instructions ?? null,
          cards_per_module:
            typeof payload.cards_per_module === 'number'
              ? payload.cards_per_module
              : null,
          quizzes_per_module:
            typeof payload.quizzes_per_module === 'number'
              ? payload.quizzes_per_module
              : null,
          override_duplicates: payload.override_duplicates ?? null,
        },
      }),
    }),
    getIngestBatchStatus: builder.query<
      AdminV3IngestBatchStatusResponse,
      string
    >({
      query: (batchId) => ({
        url: `/admin/ingest/batches/${encodeURIComponent(batchId)}`,
        method: 'GET',
      }),
      keepUnusedDataFor: 60,
    }),
    submitIngestMergeDecision: builder.mutation<
      AdminV3IngestMergeDecisionResponse,
      { batchId: string; body: AdminV3IngestMergeDecisionPayload }
    >({
      query: ({ batchId, body }) => ({
        url: `/admin/ingest/batches/${encodeURIComponent(batchId)}/merge-decision`,
        method: 'POST',
        body: {
          run_id: body.run_id,
          candidate_id: body.candidate_id,
          decision: body.decision,
        },
        responseHandler: async (response: Response) => {
          const text = await response.text();
          if (!text.trim()) {
            return {
              status: response.status === 202 ? 'accepted' : 'ok',
            } satisfies AdminV3IngestMergeDecisionResponse;
          }
          try {
            return JSON.parse(text) as AdminV3IngestMergeDecisionResponse;
          } catch {
            return {
              status: 'ok',
              detail: text,
            } satisfies AdminV3IngestMergeDecisionResponse;
          }
        },
      }),
    }),
    getIngestStatusByDocument: builder.query<
      AdminV3IngestStatusResponse,
      string
    >({
      query: (sourceDocumentId) => ({
        url: `/admin/ingest/by-document/${encodeURIComponent(sourceDocumentId)}`,
        method: 'GET',
      }),
      keepUnusedDataFor: 60,
    }),
    getIngestStatusByRunId: builder.query<AdminV3IngestStatusResponse, string>({
      query: (runId) => ({
        url: `/admin/ingest/${encodeURIComponent(runId)}`,
        method: 'GET',
      }),
      keepUnusedDataFor: 60,
    }),
  }),
  overrideExisting: false,
});

export const {
  useIngestDocumentsMutation,
  useUploadIngestFilesMutation,
  useStartIngestBatchMutation,
  useGetIngestBatchStatusQuery,
  useSubmitIngestMergeDecisionMutation,
  useGetIngestStatusByDocumentQuery,
  useGetIngestStatusByRunIdQuery,
} = adminIngestApi;
