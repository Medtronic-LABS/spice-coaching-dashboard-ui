import { adminBaseApi } from '@/store/apis/adminBase';

export type PrimaryLanguage = 'en' | 'bn';

export interface AdminV3IngestFormPayload {
  file: File;
  title: string;
  authority_kind: string;
  authority_label: string;
  primary_language: PrimaryLanguage;
}

export interface AdminV3IngestAcceptedResponse {
  source_document_id: string;
  title: string;
  source_type: string;
  stored_path: string;
  status: string;
  poll_url: string;
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

export const adminIngestApi = adminBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    ingestDocument: builder.mutation<
      AdminV3IngestAcceptedResponse,
      AdminV3IngestFormPayload
    >({
      query: (payload) => {
        const form = new FormData();
        form.append('file', payload.file, payload.file.name);
        form.append('title', payload.title);
        form.append('authority_kind', payload.authority_kind);
        form.append('authority_label', payload.authority_label);
        form.append('primary_language', payload.primary_language);
        return {
          url: '/admin/v3/ingest',
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
        url: `/admin/v3/ingest/by-document/${encodeURIComponent(sourceDocumentId)}`,
        method: 'GET',
      }),
      keepUnusedDataFor: 60,
    }),
  }),
  overrideExisting: false,
});

export const { useIngestDocumentMutation, useGetIngestStatusByDocumentQuery } =
  adminIngestApi;
