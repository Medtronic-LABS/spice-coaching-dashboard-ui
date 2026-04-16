import { baseApi } from '@/store/apis/base';
import type {
  DashboardCommonParams,
  DashboardSummaryResponse,
} from '@/types/supervisor.types';

export const homeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardSummary: builder.query<
      DashboardSummaryResponse,
      DashboardCommonParams
    >({
      query: (params) => ({
        url: 'dashboard/summary',
        params,
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useGetDashboardSummaryQuery } = homeApi;
