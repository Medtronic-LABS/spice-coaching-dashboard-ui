import { baseApi } from '@/store/apis/base';
import type { AlertsResponse as SupervisorAlertsResponse } from '@/types/supervisor.types';

export type AlertsResponse = SupervisorAlertsResponse;

export interface GetAlertsArgs {
  type: 'performance' | 'critical' | 'warning' | 'info';
}

export const alertsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAlerts: builder.query<AlertsResponse, GetAlertsArgs>({
      query: ({ type }) => ({
        url: '/api/v1/alerts',
        params: { type },
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useGetAlertsQuery } = alertsApi;
