import { baseApi } from '@/store/apis/base';
import type { ModuleLibraryResponse } from '@/features/module-library/types/moduleLibrary.types';
import type { DashboardCommonParams } from '@/types/supervisor.types';

export const moduleLibraryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getModuleLibrary: builder.query<
      ModuleLibraryResponse,
      DashboardCommonParams
    >({
      query: (params) => ({
        url: 'module-library',
        params,
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useGetModuleLibraryQuery } = moduleLibraryApi;
