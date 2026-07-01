import { baseApi } from '@/store/apis/base';

export type PrimaryLanguage = 'en' | 'bn';

export type IngestSourceType = 'pdf' | 'pptx' | 'docx' | 'audio' | 'video';

export type IngestContentDomain =
  | 'digital'
  | 'clinical'
  | 'clinical_with_app_action'
  | 'supervisor_update';

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

export interface AdminV3IngestBatchFormPayload {
  files: File[];
  titles?: string[] | null;
  fuse_sources?: boolean;
  content_domain?: IngestContentDomain;
  assessment_mode?: IngestAssessmentMode;
  authority_label?: string;
  primary_language?: PrimaryLanguage;
  mode?: IngestBatchMode;
  ingestion_instructions?: string | null;
  override_duplicates?: boolean[];
}

export interface AdminV3IngestAcceptedSource {
  source_document_id: string;
  title: string;
  source_type: IngestSourceType;
  stored_path: string;
  poll_url: string;
}

export interface AdminV3IngestAcceptedResponse {
  status: 'batch_queued';
  fuse_sources: boolean;
  mode: IngestBatchMode;
  modules_retired: number;
  sources: AdminV3IngestAcceptedSource[];
  skipped_duplicates?: IngestDuplicateConflict[];
  note?: string;
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
        if (payload.titles && payload.titles.length) {
          form.append('titles', JSON.stringify(payload.titles));
        }
        if (typeof payload.fuse_sources === 'boolean') {
          form.append('fuse_sources', String(payload.fuse_sources));
        }
        if (payload.content_domain) {
          form.append('content_domain', payload.content_domain);
        }
        if (payload.assessment_mode) {
          form.append('assessment_mode', payload.assessment_mode);
        }
        if (payload.authority_label) {
          form.append('authority_label', payload.authority_label);
        }
        if (payload.primary_language) {
          form.append('primary_language', payload.primary_language);
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
  useGetIngestStatusByDocumentQuery,
  useGetIngestStatusByRunIdQuery,
} = adminIngestApi;
