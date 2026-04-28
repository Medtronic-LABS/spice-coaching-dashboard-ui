import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query';
import {
  getMockChwDetail,
  mockDashboardSummary,
  mockFlags,
  mockLeaderboard,
  mockModuleLibrary,
  mockModules,
  mockPerformanceMatrix,
  mockQuizPerformance,
  mockReports,
} from '@/store/apis/mockData';
import type { CHWPerformanceResponse } from '@/types/supervisor.types';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getUrl(args: string | FetchArgs): string {
  if (typeof args === 'string') return args;
  return args.url;
}

function getParams(args: string | FetchArgs): unknown {
  if (typeof args === 'string') return undefined;
  return args.params;
}

function withoutLeadingSlash(value: string): string {
  return value.startsWith('/') ? value.slice(1) : value;
}

function pageSlice<T>(items: T[], page: number, limit: number): T[] {
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : items.length;
  const start = (safePage - 1) * safeLimit;
  return items.slice(start, start + safeLimit);
}

export const mockBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args) => {
  // Simulate real network latency.
  await sleep(250);

  const rawUrl = withoutLeadingSlash(getUrl(args));
  const url = rawUrl.replace(/^api\/v1\//, '').replace(/^\/?api\/v1\//, '');
  const params = getParams(args);

  // Dashboard endpoints
  if (url === 'dashboard/summary') {
    return { data: mockDashboardSummary };
  }
  if (url === 'dashboard/flags') {
    return { data: mockFlags };
  }
  if (url === 'dashboard/modules') {
    return { data: mockModules };
  }
  if (url === 'dashboard/leaderboard') {
    return { data: mockLeaderboard };
  }
  if (url === 'dashboard/performance-matrix') {
    const page =
      typeof params === 'object' && params && 'page' in params
        ? Number((params as { page?: unknown }).page)
        : 1;
    const limit =
      typeof params === 'object' && params && 'limit' in params
        ? Number((params as { limit?: unknown }).limit)
        : 30;

    const sliced: CHWPerformanceResponse = {
      ...mockPerformanceMatrix,
      data: pageSlice(mockPerformanceMatrix.data, page, limit),
      pagination: { page, total: mockPerformanceMatrix.data.length },
    };
    return { data: sliced };
  }

  // Module library endpoints
  if (url === 'module-library') {
    return { data: mockModuleLibrary };
  }

  // Quiz performance endpoints
  if (url === 'quiz-performance') {
    return { data: mockQuizPerformance };
  }

  // Reports endpoints
  if (url === 'reports') {
    return { data: mockReports };
  }

  // CHW detail endpoint: chw/{chw_id}
  if (url.startsWith('chw/')) {
    const chwId = decodeURIComponent(url.slice('chw/'.length));
    return { data: getMockChwDetail(chwId) };
  }

  return {
    error: {
      status: 404,
      data: { message: `No mock handler for ${url}` },
    },
  };
};
