import { baseApi } from '@/store/apis/base';
import type {
  DigitalHelpModuleQuestionsResponse,
  DigitalHelpModuleRequestsResponse,
  DigitalHelpModuleUsageResponse,
  DocumentUsageResponse,
  ModuleCreationSuggestionDetailResponse,
  ModuleCreationSuggestionListResponse,
  PublishedModuleCompletionsResponse,
  TeamActivityResponse,
} from '@/features/admin-dashboard/types/dashboard.types';

export interface DashboardDateParams {
  from_date: string;
  to_date: string;
}

export interface TeamActivityQuery extends DashboardDateParams {
  limit?: number;
  offset?: number;
  user_id?: number;
  depth?: number;
}

export interface DigitalHelpModulesQuery extends DashboardDateParams {
  limit?: number;
  offset?: number;
}

export interface DigitalHelpModuleQuestionsQuery extends DashboardDateParams {
  moduleId: string;
  limit?: number;
  offset?: number;
}

export interface ModuleCreationSuggestionsQuery extends DashboardDateParams {
  limit?: number;
  offset?: number;
}

export interface DocumentUsageQuery {
  from: string;
  to: string;
  district?: string;
  upazila_id?: string;
  user_id?: number;
  document_id?: string;
  top_limit?: number;
  documents_limit?: number;
  documents_offset?: number;
  events_limit?: number;
  events_offset?: number;
}

const DASHBOARD_QUERY_RETRY = { maxRetries: 2 } as const;

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    fetchTeamActivity: builder.query<TeamActivityResponse, TeamActivityQuery>({
      extraOptions: DASHBOARD_QUERY_RETRY,
      query: ({ from_date, to_date, limit, offset, user_id, depth }) => ({
        url: '/dashboard/team-activity',
        params: {
          from_date,
          to_date,
          limit,
          offset,
          user_id,
          depth,
        },
      }),
    }),
    fetchDigitalHelpModules: builder.query<
      DigitalHelpModuleUsageResponse,
      DigitalHelpModulesQuery
    >({
      extraOptions: DASHBOARD_QUERY_RETRY,
      query: ({ from_date, to_date, limit, offset }) => ({
        url: '/dashboard/digital-help-modules',
        params: {
          from_date,
          to_date,
          limit,
          offset,
        },
      }),
    }),
    fetchDigitalHelpModuleQuestions: builder.query<
      DigitalHelpModuleQuestionsResponse,
      DigitalHelpModuleQuestionsQuery
    >({
      extraOptions: DASHBOARD_QUERY_RETRY,
      query: ({ moduleId, from_date, to_date, limit, offset }) => ({
        url: `/dashboard/digital-help-modules/${encodeURIComponent(moduleId)}/questions`,
        params: {
          from_date,
          to_date,
          limit,
          offset,
        },
      }),
    }),
    fetchDigitalHelpModuleRequests: builder.query<
      DigitalHelpModuleRequestsResponse,
      Omit<DigitalHelpModuleQuestionsQuery, 'limit' | 'offset'>
    >({
      extraOptions: DASHBOARD_QUERY_RETRY,
      query: ({ moduleId, from_date, to_date }) => ({
        url: `/dashboard/digital-help-modules/${encodeURIComponent(moduleId)}/requests`,
        params: {
          from_date,
          to_date,
        },
      }),
    }),
    fetchPublishedModuleCompletions: builder.query<
      PublishedModuleCompletionsResponse,
      DigitalHelpModulesQuery
    >({
      extraOptions: DASHBOARD_QUERY_RETRY,
      query: ({ from_date, to_date, limit, offset }) => ({
        url: '/dashboard/published-module-completions',
        params: {
          from_date,
          to_date,
          limit,
          offset,
        },
      }),
    }),
    fetchModuleCreationSuggestions: builder.query<
      ModuleCreationSuggestionListResponse,
      ModuleCreationSuggestionsQuery
    >({
      extraOptions: DASHBOARD_QUERY_RETRY,
      query: ({ from_date, to_date, limit, offset }) => ({
        url: '/dashboard/module-creation-suggestions',
        params: {
          from_date,
          to_date,
          limit,
          offset,
        },
      }),
    }),
    fetchModuleCreationSuggestionDetail: builder.query<
      ModuleCreationSuggestionDetailResponse,
      { suggestionId: string }
    >({
      extraOptions: DASHBOARD_QUERY_RETRY,
      query: ({ suggestionId }) => ({
        url: `/dashboard/module-creation-suggestions/${encodeURIComponent(
          suggestionId,
        )}`,
      }),
    }),
    fetchDocumentUsage: builder.query<
      DocumentUsageResponse,
      DocumentUsageQuery
    >({
      extraOptions: DASHBOARD_QUERY_RETRY,
      query: ({
        from,
        to,
        district,
        upazila_id,
        user_id,
        document_id,
        top_limit,
        documents_limit,
        documents_offset,
        events_limit,
        events_offset,
      }) => ({
        url: '/dashboard/document-usage',
        params: {
          from,
          to,
          district,
          upazila_id,
          user_id,
          document_id,
          top_limit,
          documents_limit,
          documents_offset,
          events_limit,
          events_offset,
        },
      }),
    }),
  }),
});

export const {
  useFetchTeamActivityQuery,
  useFetchDigitalHelpModulesQuery,
  useFetchDigitalHelpModuleQuestionsQuery,
  useFetchDigitalHelpModuleRequestsQuery,
  useLazyFetchDigitalHelpModuleQuestionsQuery,
  useFetchPublishedModuleCompletionsQuery,
  useFetchModuleCreationSuggestionsQuery,
  useFetchModuleCreationSuggestionDetailQuery,
  useLazyFetchModuleCreationSuggestionDetailQuery,
  useFetchDocumentUsageQuery,
} = dashboardApi;
