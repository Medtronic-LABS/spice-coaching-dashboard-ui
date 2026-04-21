import { baseApi } from '@/store/apis/base';
import type {
  ChwDetailResponse,
  ChwProfilesListResponse,
} from '@/features/chw-profiles/types/chwProfiles.types';

export interface GetChwProfilesListParams {
  page: number;
  limit: number;
}

export const chwProfilesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getChwProfilesList: builder.query<
      ChwProfilesListResponse,
      GetChwProfilesListParams
    >({
      query: (params) => ({
        url: 'dashboard/performance-matrix',
        params,
      }),
    }),
    getChwDetail: builder.query<ChwDetailResponse, { chwId: string }>({
      query: ({ chwId }) => ({
        url: `chw/${encodeURIComponent(chwId)}`,
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useGetChwProfilesListQuery, useGetChwDetailQuery } =
  chwProfilesApi;
