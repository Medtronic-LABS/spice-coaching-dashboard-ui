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

export const adminConfigsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    fetchConfigByKey: builder.query<ConfigThreshold, string>({
      query: (key) => ({
        url: `/admin/configs/${encodeURIComponent(key)}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, key) => [{ type: 'Config', id: key }],
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
      ],
    }),
  }),
  overrideExisting: false,
});

export const { useFetchConfigByKeyQuery, useUpdateConfigMutation } =
  adminConfigsApi;
