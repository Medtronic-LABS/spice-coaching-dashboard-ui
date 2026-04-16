import { useMemo } from 'react';

import { useGetDashboardSummaryQuery } from '@/features/home/api/homeApi';
import { useGetFlagsQuery } from '@/features/home/api/flagsApi';
import { useGetModulesQuery } from '@/features/home/api/modulesApi';
import {
  useGetLeaderboardQuery,
  useGetCHWPerformanceQuery,
} from '@/features/chw/api/chwApi';
import { DEFAULT_DASHBOARD_PARAMS } from '@/features/home/constants/supervisorDashboard';
import type {
  LeaderboardItem,
  DashboardSummaryResponse,
  PerformanceAlertItem,
  CHWPerformanceRow,
  ModuleProgressItem,
} from '@/types/supervisor.types';

type QueryState = { isLoading: boolean; isError: boolean };

export interface UseSupervisorDashboardResult {
  summary: DashboardSummaryResponse | undefined;
  leaderboard: LeaderboardItem[];
  alerts: PerformanceAlertItem[];
  performance: CHWPerformanceRow[];
  modules: ModuleProgressItem[];
  isLoading: boolean;
  isError: boolean;
  summaryState: QueryState;
  leaderboardState: QueryState;
  alertsState: QueryState;
  performanceState: QueryState;
  modulesState: QueryState;
}

export const useSupervisorDashboard = (): UseSupervisorDashboardResult => {
  const params = DEFAULT_DASHBOARD_PARAMS;

  const summaryQuery = useGetDashboardSummaryQuery(params, {
    selectFromResult: ({ data, isLoading, isError }) => ({
      data,
      isLoading,
      isError,
    }),
  });
  const leaderboardQuery = useGetLeaderboardQuery(
    { ...params, limit: 5 },
    {
      selectFromResult: ({ data, isLoading, isError }) => ({
        data,
        isLoading,
        isError,
      }),
    },
  );
  const performanceQuery = useGetCHWPerformanceQuery(
    { ...params, page: 1, limit: 10 },
    {
      selectFromResult: ({ data, isLoading, isError }) => ({
        data,
        isLoading,
        isError,
      }),
    },
  );

  const flagsQuery = useGetFlagsQuery(params, {
    selectFromResult: ({ data, isLoading, isError }) => ({
      data,
      isLoading,
      isError,
    }),
  });

  const modulesQuery = useGetModulesQuery(params, {
    selectFromResult: ({ data, isLoading, isError }) => ({
      data,
      isLoading,
      isError,
    }),
  });

  return useMemo(() => {
    const summary = summaryQuery.data;
    const leaderboard = leaderboardQuery.data?.leaderboard ?? [];
    const alerts = flagsQuery.data?.flags ?? [];
    const performance = performanceQuery.data?.data ?? [];
    const modules = modulesQuery.data?.data ?? [];

    const isLoading =
      summaryQuery.isLoading ||
      leaderboardQuery.isLoading ||
      flagsQuery.isLoading ||
      performanceQuery.isLoading ||
      modulesQuery.isLoading;

    const isError =
      summaryQuery.isError ||
      leaderboardQuery.isError ||
      flagsQuery.isError ||
      performanceQuery.isError ||
      modulesQuery.isError;

    return {
      summary,
      leaderboard,
      alerts,
      performance,
      modules,
      isLoading,
      isError,
      summaryState: {
        isLoading: summaryQuery.isLoading,
        isError: summaryQuery.isError,
      },
      leaderboardState: {
        isLoading: leaderboardQuery.isLoading,
        isError: leaderboardQuery.isError,
      },
      alertsState: {
        isLoading: flagsQuery.isLoading,
        isError: flagsQuery.isError,
      },
      performanceState: {
        isLoading: performanceQuery.isLoading,
        isError: performanceQuery.isError,
      },
      modulesState: {
        isLoading: modulesQuery.isLoading,
        isError: modulesQuery.isError,
      },
    };
  }, [
    flagsQuery.data,
    flagsQuery.isError,
    flagsQuery.isLoading,
    performanceQuery.data,
    performanceQuery.isError,
    performanceQuery.isLoading,
    leaderboardQuery.data,
    leaderboardQuery.isError,
    leaderboardQuery.isLoading,
    modulesQuery.data,
    modulesQuery.isError,
    modulesQuery.isLoading,
    summaryQuery.data,
    summaryQuery.isError,
    summaryQuery.isLoading,
  ]);
};
