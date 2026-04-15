import { baseApi } from '@/store/apis/base';
import type { DashboardSummaryResponse } from '@/types/supervisor.types';

export interface HomeStatusResponse {
  message: string;
}

export const homeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardSummary: builder.query<DashboardSummaryResponse, void>({
      query: () => '/api/v1/home/dashboard-summary',
    }),
  }),
  overrideExisting: false,
});

export const { useGetDashboardSummaryQuery } = homeApi;
