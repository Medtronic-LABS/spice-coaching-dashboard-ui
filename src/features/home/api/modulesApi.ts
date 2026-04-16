import { baseApi } from '@/store/apis/base';
import type {
  DashboardCommonParams,
  ModulesProgressResponse,
} from '@/types/supervisor.types';

export const modulesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getModules: builder.query<ModulesProgressResponse, DashboardCommonParams>({
      query: (params) => ({
        url: 'dashboard/modules',
        params,
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useGetModulesQuery } = modulesApi;
