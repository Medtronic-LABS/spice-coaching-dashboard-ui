import { createApi } from '@reduxjs/toolkit/query/react';
import { mockBaseQuery } from '@/store/apis/mockBaseQuery';

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: mockBaseQuery,
  // baseQuery: fetchBaseQuery({
  //   baseUrl: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  //   credentials: 'include',
  // }),
  endpoints: () => ({}),
});
