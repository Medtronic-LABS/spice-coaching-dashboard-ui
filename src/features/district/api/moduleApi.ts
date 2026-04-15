import { baseApi } from '@/store/apis/base';
import type { ModulesProgressResponse as SupervisorModulesProgressResponse } from '@/types/supervisor.types';

export type ModulesProgressResponse = SupervisorModulesProgressResponse;

export const moduleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getModules: builder.query<ModulesProgressResponse, void>({
      query: () => '/api/v1/modules/progress',
    }),
  }),
  overrideExisting: false,
});

export const { useGetModulesQuery } = moduleApi;
