import { useMemo } from 'react';

import { useGetDashboardSummaryQuery } from '@/features/home/api/homeApi';
import {
  useGetLeaderboardQuery,
  useGetCHWPerformanceQuery,
} from '@/features/chw/api/chwApi';
import { useGetAlertsQuery } from '@/features/alerts/api/alertsApi';
import { useGetModulesQuery } from '@/features/district/api/moduleApi';
import type {
  LeaderboardItem,
  DashboardSummaryResponse,
  PerformanceAlertItem,
  CHWPerformanceRow,
  ModuleProgressItem,
} from '@/types/supervisor.types';

export interface UseSupervisorDashboardResult {
  summary: DashboardSummaryResponse | undefined;
  leaderboard: LeaderboardItem[];
  alerts: PerformanceAlertItem[];
  performance: CHWPerformanceRow[];
  modules: ModuleProgressItem[];
  isLoading: boolean;
  isError: boolean;
  summaryState: { isLoading: boolean; isError: boolean };
  leaderboardState: { isLoading: boolean; isError: boolean };
  alertsState: { isLoading: boolean; isError: boolean };
  performanceState: { isLoading: boolean; isError: boolean };
  modulesState: { isLoading: boolean; isError: boolean };
}

export const useSupervisorDashboard = (): UseSupervisorDashboardResult => {
  const summaryQuery = useGetDashboardSummaryQuery(undefined, {
    selectFromResult: ({ data, isLoading, isError }) => ({
      data,
      isLoading,
      isError,
    }),
  });
  const leaderboardQuery = useGetLeaderboardQuery(undefined, {
    selectFromResult: ({ data, isLoading, isError }) => ({
      data,
      isLoading,
      isError,
    }),
  });
  const performanceQuery = useGetCHWPerformanceQuery(undefined, {
    selectFromResult: ({ data, isLoading, isError }) => ({
      data,
      isLoading,
      isError,
    }),
  });

  const alertsQuery = useGetAlertsQuery(
    { type: 'performance' },
    {
      selectFromResult: ({ data, isLoading, isError }) => ({
        data,
        isLoading,
        isError,
      }),
    },
  );

  const modulesQuery = useGetModulesQuery(undefined, {
    selectFromResult: ({ data, isLoading, isError }) => ({
      data,
      isLoading,
      isError,
    }),
  });

  return useMemo(() => {
    const summary = summaryQuery.data;
    const leaderboard = leaderboardQuery.data?.leaderboard ?? [];
    const alerts = alertsQuery.data?.flags ?? [];
    const performance = performanceQuery.data?.data ?? [];
    const modules = modulesQuery.data?.data ?? [];

    const isLoading =
      summaryQuery.isLoading ||
      leaderboardQuery.isLoading ||
      alertsQuery.isLoading ||
      performanceQuery.isLoading ||
      modulesQuery.isLoading;

    const isError =
      summaryQuery.isError ||
      leaderboardQuery.isError ||
      alertsQuery.isError ||
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
        isLoading: alertsQuery.isLoading,
        isError: alertsQuery.isError,
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
    alertsQuery.data,
    alertsQuery.isError,
    alertsQuery.isLoading,
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
