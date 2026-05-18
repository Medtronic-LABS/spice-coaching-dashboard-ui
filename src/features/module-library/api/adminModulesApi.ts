import { adminBaseApi } from '@/store/apis/adminBase';

export type AdminModuleLifecycleStatus = 'draft' | 'published' | 'retired';

export type AdminModuleDifficulty = 'easy' | 'medium' | 'hard' | string;

export interface AdminModulesListItem {
  id: string;
  module_family_id: string;
  version: number;
  title_bn: string | null;
  title_en: string | null;
  description_bn: string | null;
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
  module_json: { cards: unknown[]; quiz?: AdminModuleQuizItem[] };
  editor_id?: string;
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

export const adminModulesApi = adminBaseApi.injectEndpoints({
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
    getModuleDetail: builder.query<AdminModuleDetailResponse, string>({
      query: (moduleId) => ({
        url: `/admin/modules/${encodeURIComponent(moduleId)}`,
        method: 'GET',
      }),
      keepUnusedDataFor: 0,
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
  useGetModuleDetailQuery,
  useEditModuleMutation,
  useSetClinicallyReviewedMutation,
  useDeleteModuleMutation,
} = adminModulesApi;
