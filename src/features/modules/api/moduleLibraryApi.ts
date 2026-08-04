import { baseApi } from '@/store/apis/base';
import type {
  ModuleLibraryQueryParams,
  ModuleLibraryResponse,
} from '@/features/modules/types/moduleLibrary.types';

export const moduleLibraryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getModuleLibrary: builder.query<
      ModuleLibraryResponse,
      ModuleLibraryQueryParams
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
