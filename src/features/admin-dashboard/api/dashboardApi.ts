import {
  normalizeDigitalHelpModuleQuestionsResponse,
  normalizeDigitalHelpModuleRequestsResponse,
  normalizeDigitalHelpModuleUsageResponse,
  normalizeSuggestionDetailResponse,
  normalizeSuggestionListResponse,
} from '@/features/admin-dashboard/api/dashboardResponseNormalizers';
import { baseApi } from '@/store/apis/base';
import type {
  DashboardGeographyFilters,
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

export type DashboardStatusQueryParam = 'all' | 'on_track' | 'at_risk';

export function buildDashboardGeoParams(
  geography: DashboardGeographyFilters,
): Record<string, string> {
  const params: Record<string, string> = {};
  if (geography.division.trim()) params.division = geography.division.trim();
  if (geography.district.trim()) params.district = geography.district.trim();
  if (geography.upazila.trim()) params.upazila_id = geography.upazila.trim();
  return params;
}

export interface TeamActivityQuery extends DashboardDateParams {
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
  district?: string;
  upazila_id?: string;
}

export interface DigitalHelpModulesQuery extends DashboardDateParams {
  limit?: number;
  offset?: number;
  geography: DashboardGeographyFilters;
}

export interface PublishedModuleCompletionsQuery extends DashboardDateParams {
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

export interface DocumentUsageQuery {
  from: string;
  to: string;
  district?: string;
  /**
   * Today BE matches this by upazila **name** (param name is historical).
   * FE sends the display name until BE documents numeric admin id support.
   */
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
