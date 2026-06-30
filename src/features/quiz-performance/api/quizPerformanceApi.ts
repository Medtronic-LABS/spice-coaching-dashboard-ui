import { baseApi } from '@/store/apis/base';
import type { QuizPerformanceResponse } from '@/features/quiz-performance/types/quizPerformance.types';
import type { DashboardCommonParams } from '@/types/supervisor.types';

export const quizPerformanceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getQuizPerformance: builder.query<
      QuizPerformanceResponse,
      DashboardCommonParams
    >({
      query: (params) => ({
        url: 'quiz-performance',
        params,
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useGetQuizPerformanceQuery } = quizPerformanceApi;
