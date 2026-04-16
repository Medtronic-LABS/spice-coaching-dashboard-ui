import { baseApi } from '@/store/apis/base';
import type {
  CHWPerformanceResponse,
  DashboardCommonParams,
  LeaderboardResponse,
} from '@/types/supervisor.types';

export type LeaderboardParams = DashboardCommonParams & {
  limit: number;
};

export type PerformanceMatrixParams = DashboardCommonParams & {
  page: number;
  limit: number;
};

export const chwApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLeaderboard: builder.query<LeaderboardResponse, LeaderboardParams>({
      query: (params) => ({
        url: 'dashboard/leaderboard',
        params,
      }),
    }),
    getCHWPerformance: builder.query<
      CHWPerformanceResponse,
      PerformanceMatrixParams
    >({
      query: (params) => ({
        url: 'dashboard/performance-matrix',
        params,
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useGetCHWPerformanceQuery, useGetLeaderboardQuery } = chwApi;
