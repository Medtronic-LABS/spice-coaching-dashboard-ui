import { baseApi } from '@/store/apis/base';
import type { ReportsResponse } from '@/features/reports/types/reports.types';
import type { DashboardCommonParams } from '@/types/supervisor.types';

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getReports: builder.query<ReportsResponse, DashboardCommonParams>({
      query: (params) => ({
        url: 'reports',
        params,
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useGetReportsQuery } = reportsApi;
