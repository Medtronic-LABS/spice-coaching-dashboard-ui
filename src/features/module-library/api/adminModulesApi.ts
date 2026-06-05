import type { AdminModuleCard } from '@/features/module-library/types/adminModule.types';
import { sortQuizItems } from '@/features/module-library/utils/adminModuleQuizUtils';
import { normalizeAdminModuleCard } from '@/features/module-library/utils/cardBody';
import { baseApi } from '@/store/apis/base';

export type AdminModuleLifecycleStatus = 'draft' | 'published' | 'retired';

export type AdminModuleDifficulty = 'easy' | 'medium' | 'hard' | string;

export interface AdminModulesListItem {
  id: string;
  module_family_id: string;
  version: number;
  title_bn: string | null;
  title_en: string | null;
  description_bn: string | null;
  description_en?: string | null;
  domain: string;
  module_type: string;
  lifecycle_status: AdminModuleLifecycleStatus;
  clinically_reviewed: boolean;
  has_visibility_window: boolean;
  card_count: number;
  estimated_minutes: number;
  published_at: string | null;
  created_at: string;
  quality_flags?: { flags: string[] } | null;
  quiz_count: number;
}

export interface AdminModuleQuizItem {
  id: string;
  question_order: number;
  question_bn: string | null;
  question_en: string | null;
  case_setup_bn: string | null;
  case_setup_en: string | null;
  options_bn: string[];
  options_en: string[];
  correct_indices: number[];
  explanation_bn: string | null;
  explanation_en: string | null;
  difficulty: AdminModuleDifficulty;
}

export interface AdminModuleDetailResponse {
  id: string;
  module_family_id: string;
  version: number;
  title_bn: string | null;
  title_en: string | null;
  description_bn: string | null;
  description_en: string | null;
  domain: string;
  module_type: string;
  lifecycle_status: AdminModuleLifecycleStatus;
  clinically_reviewed: boolean;
  has_visibility_window: boolean;
  card_count: number;
  estimated_minutes: number;
  published_at: string | null;
  created_at: string;
  quality_flags: { flags: string[] } | null;
  cards: unknown[];
  quiz: AdminModuleQuizItem[];
}

export interface EditAdminModuleRequestBody {
  title_bn?: string;
  title_en?: string;
  description_bn?: string;
  description_en?: string;
  module_json: { cards: unknown[]; quiz?: AdminModuleQuizItem[] };
  editor_id?: string;
}

export type AdminModuleRefresherType = 'refresher' | string;

export interface CreateAdminModuleRequestBody {
  title_bn: string | null;
  title_en: string | null;
  description_bn: string | null;
  description_en: string | null;
  domain: string;
  sub_domain?: string | null;
  module_type: AdminModuleRefresherType;
  estimated_minutes: number;
  difficulty_level?: string | null;
  module_json: AdminModuleModuleJson;
}

export interface CreateAdminModuleResponse {
  id: string;
}

function normalizeSourceDocuments(value: unknown): AdminModuleSourceDocument[] {
  if (!Array.isArray(value)) return [];
  const documents: AdminModuleSourceDocument[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const record = entry as Record<string, unknown>;
    const source_document_id = record.source_document_id;
    const presigned_url = record.presigned_url;
    if (
      typeof source_document_id !== 'string' ||
      !source_document_id.trim() ||
      typeof presigned_url !== 'string' ||
      !presigned_url.trim()
    ) {
      continue;
    }
    documents.push({
      source_document_id: source_document_id.trim(),
      presigned_url: presigned_url.trim(),
      presigned_expires_seconds:
        typeof record.presigned_expires_seconds === 'number'
          ? record.presigned_expires_seconds
          : 0,
    });
  }
  return documents;
}

function normalizeModuleDetail(
  response: {
    module_json?: Partial<AdminModuleModuleJson>;
    cards?: unknown[];
    quiz?: AdminModuleQuizItem[];
    source_documents?: unknown;
  } & Omit<
    AdminModuleDetailResponse,
    'module_json' | 'cards' | 'quiz' | 'source_documents'
  >,
): AdminModuleDetailResponse {
  const rawCards = response.module_json?.cards ?? response.cards ?? [];
  const cards = rawCards.map((card, index) =>
    normalizeAdminModuleCard(card, index),
  );
  const quiz = sortQuizItems(response.module_json?.quiz ?? response.quiz ?? []);
  const source_documents = normalizeSourceDocuments(response.source_documents);

  return {
    ...response,
    cards,
    quiz,
    source_documents,
    module_json: { cards, quiz },
  };
}

export interface EditAdminModuleResponse {
  id: string;
  module_family_id: string;
  version: number;
  supersedes_module_id: string;
}

export interface ClinicallyReviewedRequestBody {
  clinically_reviewed: true;
  reviewer_id?: string;
}

export interface ClinicallyReviewedResponse {
  id: string;
  clinically_reviewed: boolean;
  clinically_reviewed_at: string;
  clinically_reviewed_by: string;
}

export interface RetireModuleResponse {
  id: string;
  lifecycle_status: 'retired';
  deprecated_at: string;
}

export const adminModulesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    fetchModules: builder.query<
      AdminModulesListItem[],
      {
        limit: number;
        offset: number;
        status?: AdminModuleLifecycleStatus | null;
      }
    >({
      query: (params) => ({
        url: '/admin/modules',
        method: 'GET',
        params,
      }),
    }),
    createModule: builder.mutation<
      CreateAdminModuleResponse,
      CreateAdminModuleRequestBody
    >({
      query: (body) => ({
        url: '/admin/modules',
        method: 'POST',
        body,
      }),
    }),
    getModuleDetail: builder.query<AdminModuleDetailResponse, string>({
      query: (moduleId) => ({
        url: `/admin/modules/${encodeURIComponent(moduleId)}`,
        method: 'GET',
      }),
      /** Retain briefly so `useAdminModuleDetailQuery(..., { useCache: true })` can reuse across review steps. */
      keepUnusedDataFor: 300,
    }),
    editModule: builder.mutation<
      EditAdminModuleResponse,
      { moduleId: string; body: EditAdminModuleRequestBody }
    >({
      query: ({ moduleId, body }) => ({
        url: `/admin/modules/${encodeURIComponent(moduleId)}`,
        method: 'PUT',
        body,
      }),
    }),
    setClinicallyReviewed: builder.mutation<
      ClinicallyReviewedResponse,
      { moduleId: string; body: ClinicallyReviewedRequestBody }
    >({
      query: ({ moduleId, body }) => ({
        url: `/admin/modules/${encodeURIComponent(moduleId)}/clinically-reviewed`,
        method: 'POST',
        body,
      }),
    }),
    deleteModule: builder.mutation<RetireModuleResponse, { moduleId: string }>({
      query: ({ moduleId }) => ({
        url: `/admin/modules/${encodeURIComponent(moduleId)}`,
        method: 'DELETE',
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useFetchModulesQuery,
  useCreateModuleMutation,
  useGetModuleDetailQuery,
  useEditModuleMutation,
  useSetClinicallyReviewedMutation,
  useDeleteModuleMutation,
} = adminModulesApi;
