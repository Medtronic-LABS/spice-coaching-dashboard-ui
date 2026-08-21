import {
  normalizeDigitalHelpModuleQuestionsResponse,
  normalizeDigitalHelpModuleRequestsResponse,
  normalizeDigitalHelpModuleUsageResponse,
  normalizeSuggestionDetailResponse,
  normalizeSuggestionListResponse,
} from '@/features/admin-dashboard/api/dashboardResponseNormalizers';
import { buildDashboardGeoParams } from '@/features/admin-dashboard/utils/dashboardQueryArgs';
import { normalizeModuleDemandSummaryResponse } from '@/features/admin-dashboard/utils/normalizeModuleDemandSummaryResponse';
import { baseApi } from '@/store/apis/base';
import type {
  DashboardGeographyFilters,
  DashboardActorView,
  DashboardGeoQueryParams,
  DigitalHelpModuleQuestionsResponse,
  DigitalHelpModuleRequestsResponse,
  DigitalHelpModuleUsageResponse,
  DocumentUsageResponse,
  ModuleCreationSuggestionDetailResponse,
  ModuleCreationSuggestionListResponse,
  ModuleDemandSummaryResponse,
  PublishedModuleCompletionsResponse,
  TeamActivityApiSortBy,
  TeamActivityApiSortDir,
  TeamActivityResponse,
  TeamMemberQuestionsResponse,
} from '@/features/admin-dashboard/types/dashboard.types';

export interface DashboardDateParams {
  from_date: string;
  to_date: string;
}

export interface TeamActivityQuery
  extends DashboardDateParams, DashboardGeoQueryParams {
  limit?: number;
  offset?: number;
  user_id?: number;
  depth?: number;
  /** Case-insensitive substring on current-level member name. */
  q?: string;
  sort_by?: TeamActivityApiSortBy;
  sort_dir?: TeamActivityApiSortDir;
}

export interface TeamMemberQuestionsQuery
  extends DashboardDateParams, DashboardGeoQueryParams {
  userId: number;
  limit?: number;
  offset?: number;
}

export interface DigitalHelpModulesQuery extends DashboardDateParams {
  limit?: number;
  offset?: number;
  geography: DashboardGeographyFilters;
  /** Optional PO/SK actor lens (`view=po|sk`). */
  view?: DashboardActorView;
}

export interface PublishedModuleCompletionsQuery
  extends DashboardDateParams, DashboardGeoQueryParams {
  limit?: number;
  offset?: number;
}

export interface DigitalHelpModuleQuestionsQuery extends DashboardDateParams {
  moduleId: string;
  limit?: number;
  offset?: number;
  geography: DashboardGeographyFilters;
  /** Optional PO/SK actor lens (`view=po|sk`). */
  view?: DashboardActorView;
}

export interface ModuleCreationSuggestionsQuery extends DashboardDateParams {
  limit?: number;
  offset?: number;
  geography: DashboardGeographyFilters;
  /** Optional PO/SK actor lens (`view=po|sk`). */
  view?: DashboardActorView;
}

export interface ModuleCreationSuggestionDetailQuery {
  suggestionId: string;
  geography: DashboardGeographyFilters;
  /** Optional PO/SK actor lens (`view=po|sk`). */
  view?: DashboardActorView;
}

export interface ModuleDemandSummaryQuery
  extends DashboardDateParams, DashboardGeoQueryParams {
  top_limit?: number;
}

export interface DocumentUsageQuery extends DashboardGeoQueryParams {
  from: string;
  to: string;
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
      query: ({
        from_date,
        to_date,
        limit,
        offset,
        user_id,
        depth,
        q,
        sort_by,
        sort_dir,
        ...geo
      }) => ({
        url: '/dashboard/team-activity',
        params: {
          from_date,
          to_date,
          limit,
          offset,
          user_id,
          depth,
          q,
          sort_by,
          sort_dir,
          ...geo,
        },
      }),
    }),
    fetchTeamMemberQuestions: builder.query<
      TeamMemberQuestionsResponse,
      TeamMemberQuestionsQuery
    >({
      extraOptions: DASHBOARD_QUERY_RETRY,
      query: ({ userId, from_date, to_date, limit, offset, ...geo }) => ({
        url: `/dashboard/team-activity/users/${encodeURIComponent(String(userId))}/questions`,
        params: {
          from_date,
          to_date,
          limit,
          offset,
          ...geo,
        },
      }),
    }),
    fetchDigitalHelpModules: builder.query<
      DigitalHelpModuleUsageResponse,
      DigitalHelpModulesQuery
    >({
      extraOptions: DASHBOARD_QUERY_RETRY,
      query: ({ from_date, to_date, limit, offset, geography, view }) => ({
        url: '/dashboard/digital-help-modules',
        params: {
          from_date,
          to_date,
          limit,
          offset,
          ...(view ? { view } : {}),
          ...buildDashboardGeoParams(geography),
        },
      }),
      transformResponse: (response: unknown) =>
        normalizeDigitalHelpModuleUsageResponse(response),
    }),
    fetchDigitalHelpModuleQuestions: builder.query<
      DigitalHelpModuleQuestionsResponse,
      DigitalHelpModuleQuestionsQuery
    >({
      extraOptions: DASHBOARD_QUERY_RETRY,
      query: ({
        moduleId,
        from_date,
        to_date,
        limit,
        offset,
        geography,
        view,
      }) => ({
        url: `/dashboard/digital-help-modules/${encodeURIComponent(moduleId)}/questions`,
        params: {
          from_date,
          to_date,
          limit,
          offset,
          ...(view ? { view } : {}),
          ...buildDashboardGeoParams(geography),
        },
      }),
      transformResponse: (response: unknown) =>
        normalizeDigitalHelpModuleQuestionsResponse(response),
    }),
    fetchDigitalHelpModuleRequests: builder.query<
      DigitalHelpModuleRequestsResponse,
      DigitalHelpModuleQuestionsQuery
    >({
      extraOptions: DASHBOARD_QUERY_RETRY,
      query: ({
        moduleId,
        from_date,
        to_date,
        limit,
        offset,
        geography,
        view,
      }) => ({
        url: `/dashboard/digital-help-modules/${encodeURIComponent(moduleId)}/requests`,
        params: {
          from_date,
          to_date,
          limit,
          offset,
          ...(view ? { view } : {}),
          ...buildDashboardGeoParams(geography),
        },
      }),
      transformResponse: (response: unknown) =>
        normalizeDigitalHelpModuleRequestsResponse(response),
    }),
    fetchPublishedModuleCompletions: builder.query<
      PublishedModuleCompletionsResponse,
      PublishedModuleCompletionsQuery
    >({
      extraOptions: DASHBOARD_QUERY_RETRY,
      query: ({ from_date, to_date, limit, offset, ...geo }) => ({
        url: '/dashboard/published-module-completions',
        params: {
          from_date,
          to_date,
          limit,
          offset,
          ...geo,
        },
      }),
    }),
    fetchModuleCreationSuggestions: builder.query<
      ModuleCreationSuggestionListResponse,
      ModuleCreationSuggestionsQuery
    >({
      extraOptions: DASHBOARD_QUERY_RETRY,
      query: ({ from_date, to_date, limit, offset, geography, view }) => ({
        url: '/dashboard/module-creation-suggestions',
        params: {
          from_date,
          to_date,
          limit,
          offset,
          ...(view ? { view } : {}),
          ...buildDashboardGeoParams(geography),
        },
      }),
      transformResponse: (response: unknown) =>
        normalizeSuggestionListResponse(response),
    }),
    fetchModuleCreationSuggestionDetail: builder.query<
      ModuleCreationSuggestionDetailResponse,
      ModuleCreationSuggestionDetailQuery
    >({
      extraOptions: DASHBOARD_QUERY_RETRY,
      query: ({ suggestionId, geography, view }) => ({
        url: `/dashboard/module-creation-suggestions/${encodeURIComponent(
          suggestionId,
        )}`,
        params: {
          ...(view ? { view } : {}),
          ...buildDashboardGeoParams(geography),
        },
      }),
      transformResponse: (response: unknown) => {
        const normalized = normalizeSuggestionDetailResponse(response);
        if (!normalized) {
          throw new Error('Invalid module creation suggestion detail response');
        }
        return normalized;
      },
    }),
    fetchModuleDemandSummary: builder.query<
      ModuleDemandSummaryResponse,
      ModuleDemandSummaryQuery
    >({
      extraOptions: DASHBOARD_QUERY_RETRY,
      query: ({ from_date, to_date, top_limit, ...geo }) => ({
        url: '/dashboard/module-demand-summary',
        params: {
          from_date,
          to_date,
          top_limit,
          ...geo,
        },
      }),
      transformResponse: (response: unknown): ModuleDemandSummaryResponse =>
        normalizeModuleDemandSummaryResponse(response),
    }),
    fetchDocumentUsage: builder.query<
      DocumentUsageResponse,
      DocumentUsageQuery
    >({
      extraOptions: DASHBOARD_QUERY_RETRY,
      query: ({
        from,
        to,
        user_id,
        document_id,
        top_limit,
        documents_limit,
        documents_offset,
        events_limit,
        events_offset,
        ...geo
      }) => ({
        url: '/dashboard/document-usage',
        params: {
          from,
          to,
          user_id,
          document_id,
          top_limit,
          documents_limit,
          documents_offset,
          events_limit,
          events_offset,
          ...geo,
        },
      }),
    }),
  }),
});

export const {
  useFetchTeamActivityQuery,
  useFetchTeamMemberQuestionsQuery,
  useFetchDigitalHelpModulesQuery,
  useFetchDigitalHelpModuleQuestionsQuery,
  useFetchDigitalHelpModuleRequestsQuery,
  useLazyFetchDigitalHelpModuleQuestionsQuery,
  useFetchPublishedModuleCompletionsQuery,
  useFetchModuleCreationSuggestionsQuery,
  useFetchModuleCreationSuggestionDetailQuery,
  useLazyFetchModuleCreationSuggestionDetailQuery,
  useFetchModuleDemandSummaryQuery,
  useFetchDocumentUsageQuery,
} = dashboardApi;
