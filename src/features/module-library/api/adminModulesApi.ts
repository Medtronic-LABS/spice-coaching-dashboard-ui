import { adminBaseApi } from '@/store/apis/adminBase';

export type AdminModuleStatus = 'auto_generated' | 'published' | 'draft';

export interface AdminModuleListItem {
  id: string;
  title: string;
  description: string;
  lessons_count: number;
  questions_count: number;
  estimated_completion_time: number;
  status: AdminModuleStatus;
  clinical_domain: string;
}

export interface FetchModulesResponse {
  modules: AdminModuleListItem[];
  count: number;
  limit: number;
  offset: number;
  applied_filters?: { clinical_domain?: string };
}

export interface AdminModuleDetailResponse {
  module_id: string;
  clinical_domain: string;
  document_id: string;
  difficulty_level?: string;
  estimated_time_minutes?: number;
  version?: number;
  source_scenario_ids?: string[];
  validation_status?: string;
  confidence_score?: number;
  module_json?: unknown;
  created_at?: string;
  updated_at?: string;
}

export const adminModulesApi = adminBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    fetchModules: builder.query<
      FetchModulesResponse,
      { clinical_domain?: string; limit: number; offset: number }
    >({
      query: (params) => ({
        url: '/admin/fetch-modules',
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
    deleteModule: builder.mutation<{ status?: string }, { moduleId: string }>({
      query: ({ moduleId }) => ({
        url: `/admin/module/${encodeURIComponent(moduleId)}`,
        method: 'DELETE',
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useFetchModulesQuery,
  useGetModuleDetailQuery,
  useDeleteModuleMutation,
} = adminModulesApi;
