import { baseApi } from '@/store/apis/base';

export interface HomeStatusResponse {
  message: string;
}

export const homeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getHomeStatus: builder.query<HomeStatusResponse, void>({
      query: () => 'example-endpoint',
    }),
  }),
  overrideExisting: false,
});

export const { useGetHomeStatusQuery } = homeApi;
