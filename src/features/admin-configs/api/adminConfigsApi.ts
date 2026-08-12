import { baseApi } from '@/store/apis/base';

export const MODULE_ASSIGNMENT_DURATION_KEY = 'quiz_reattempt_validity_days';

export interface ConfigThreshold {
  id: number;
  version: number;
  key: string;
  title: string | null;
  value_json: unknown;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateConfigPayload {
  title?: string | null;
  value_json: unknown;
  description?: string | null;
}

export interface ConfigThresholdChangeItem {
  previous_value_json: unknown | null;
  current_value_json: unknown;
  updated_by: string;
  updated_at: string;
}

export interface ConfigThresholdChangeListResponse {
  changes: ConfigThresholdChangeItem[];
  total_changes: number;
  total_pages: number;
  limit: number;
  offset: number;
}

export interface FetchConfigChangesParams {
  key: string;
  limit?: number;
  offset?: number;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function toNonNegativeInteger(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
    ? value
    : fallback;
}

export function normalizeConfigThresholdChangeItem(
  item: Record<string, unknown>,
): ConfigThresholdChangeItem {
  return {
    previous_value_json:
      'previous_value_json' in item ? item.previous_value_json : null,
    current_value_json:
      'current_value_json' in item ? item.current_value_json : null,
    updated_by: typeof item.updated_by === 'string' ? item.updated_by : '',
    updated_at: typeof item.updated_at === 'string' ? item.updated_at : '',
  };
}

export function normalizeConfigThresholdChangeListResponse(
  response: unknown,
): ConfigThresholdChangeListResponse {
  if (!isPlainObject(response)) {
    return {
      changes: [],
      total_changes: 0,
      total_pages: 0,
      limit: 0,
      offset: 0,
    };
  }

  const changes = Array.isArray(response.changes)
    ? response.changes
        .filter(isPlainObject)
        .map((item) => normalizeConfigThresholdChangeItem(item))
    : [];

  return {
    changes,
    total_changes: toNonNegativeInteger(response.total_changes, changes.length),
    total_pages: toNonNegativeInteger(
      response.total_pages,
      changes.length ? 1 : 0,
    ),
    limit: toNonNegativeInteger(response.limit, changes.length),
    offset: toNonNegativeInteger(response.offset, 0),
  };
}

export const adminConfigsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    fetchConfigByKey: builder.query<ConfigThreshold, string>({
      query: (key) => ({
        url: `/admin/configs/${encodeURIComponent(key)}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, key) => [{ type: 'Config', id: key }],
    }),
    fetchConfigChanges: builder.query<
      ConfigThresholdChangeListResponse,
      FetchConfigChangesParams
    >({
      query: ({ key, limit = 10, offset = 0 }) => ({
        url: `/admin/configs/${encodeURIComponent(key)}/changes`,
        method: 'GET',
        params: { limit, offset },
      }),
      transformResponse: (response: unknown) =>
        normalizeConfigThresholdChangeListResponse(response),
      providesTags: (_result, _error, { key }) => [
        { type: 'ConfigHistory', id: key },
      ],
    }),
    updateConfig: builder.mutation<
      ConfigThreshold,
      { key: string; body: UpdateConfigPayload }
    >({
      query: ({ key, body }) => ({
        url: `/admin/configs/${encodeURIComponent(key)}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { key }) => [
        { type: 'Config', id: key },
        { type: 'ConfigHistory', id: key },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useFetchConfigByKeyQuery,
  useFetchConfigChangesQuery,
  useUpdateConfigMutation,
} = adminConfigsApi;
