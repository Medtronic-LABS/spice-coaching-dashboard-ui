import {
  normalizeDigitalHelpModuleQuestionsResponse,
  normalizeDigitalHelpModuleRequestsResponse,
  normalizeDigitalHelpModuleUsageResponse,
  normalizeSuggestionDetailResponse,
  normalizeSuggestionListResponse,
} from '@/features/admin-dashboard/api/dashboardResponseNormalizers';
import { buildDashboardGeoParams } from '@/features/admin-dashboard/utils/dashboardQueryArgs';
import { baseApi } from '@/store/apis/base';
import type {
  DashboardGeographyFilters,
  DashboardGeoQueryParams,
  DigitalHelpModuleQuestionsResponse,
  DigitalHelpModuleRequestsResponse,
  DigitalHelpModuleUsageResponse,
  DocumentUsageResponse,
  ModuleCreationSuggestionDetailResponse,
  ModuleCreationSuggestionListResponse,
  ModuleDemandSummaryResponse,
  PublishedModuleCompletionsResponse,
  TeamActivityResponse,
  TeamMemberQuestionsResponse,
} from '@/features/admin-dashboard/types/dashboard.types';

export interface DashboardDateParams {
  from_date: string;
  to_date: string;
}

export type DashboardStatusQueryParam = 'all' | 'on_track' | 'at_risk';

export interface TeamActivityQuery
  extends DashboardDateParams, DashboardGeoQueryParams {
  limit?: number;
  offset?: number;
  user_id?: number;
  depth?: number;
  /** Pending BE: search before pagination. */
  q?: string;
  /** Pending BE: sort key aligned with hierarchy sort dropdown. */
  sort_by?: string;
  /** Pending BE: `asc` | `desc`. */
  sort_dir?: 'asc' | 'desc';
  /** Pending BE: hierarchy status filter. */
  status?: DashboardStatusQueryParam;
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
}

export interface ModuleCreationSuggestionsQuery extends DashboardDateParams {
  limit?: number;
  offset?: number;
  geography: DashboardGeographyFilters;
}

export interface ModuleCreationSuggestionDetailQuery {
  suggestionId: string;
  geography: DashboardGeographyFilters;
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
      query: ({ from_date, to_date, limit, offset, geography }) => ({
        url: '/dashboard/digital-help-modules',
        params: {
          from_date,
          to_date,
          limit,
          offset,
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
      query: ({ moduleId, from_date, to_date, limit, offset, geography }) => ({
        url: `/dashboard/digital-help-modules/${encodeURIComponent(moduleId)}/questions`,
        params: {
          from_date,
          to_date,
          limit,
          offset,
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
      query: ({ moduleId, from_date, to_date, limit, offset, geography }) => ({
        url: `/dashboard/digital-help-modules/${encodeURIComponent(moduleId)}/requests`,
        params: {
          from_date,
          to_date,
          limit,
          offset,
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
      query: ({ from_date, to_date, limit, offset, geography }) => ({
        url: '/dashboard/module-creation-suggestions',
        params: {
          from_date,
          to_date,
          limit,
          offset,
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
      query: ({ suggestionId, geography }) => ({
        url: `/dashboard/module-creation-suggestions/${encodeURIComponent(
          suggestionId,
        )}`,
        params: buildDashboardGeoParams(geography),
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
      transformResponse: (response: unknown): ModuleDemandSummaryResponse => {
        if (
          typeof response !== 'object' ||
          response === null ||
          Array.isArray(response)
        ) {
          return { from_date: '', to_date: '', summary: '' };
        }
        const record = response as Record<string, unknown>;
        return {
          from_date:
            typeof record.from_date === 'string' ? record.from_date : '',
          to_date: typeof record.to_date === 'string' ? record.to_date : '',
          summary: typeof record.summary === 'string' ? record.summary : '',
        };
      },
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
