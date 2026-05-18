import { baseApi } from '@/store/apis/base';
import type {
  AlertsResponse,
  DashboardCommonParams,
} from '@/types/supervisor.types';

export const flagsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFlags: builder.query<AlertsResponse, DashboardCommonParams>({
      query: (params) => ({
        url: 'dashboard/flags',
        params,
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useGetFlagsQuery } = flagsApi;
