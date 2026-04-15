import { baseApi } from '@/store/apis/base';
import type {
  CHWPerformanceResponse,
  LeaderboardResponse,
} from '@/types/supervisor.types';

export const chwApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLeaderboard: builder.query<LeaderboardResponse, void>({
      query: () => '/api/v1/chw/leaderboard',
    }),
    getCHWPerformance: builder.query<CHWPerformanceResponse, void>({
      query: () => '/api/v1/chw/performance',
    }),
  }),
  overrideExisting: false,
});

export const { useGetCHWPerformanceQuery, useGetLeaderboardQuery } = chwApi;
