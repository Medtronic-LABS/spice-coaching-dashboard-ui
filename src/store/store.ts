import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from '@/store/apis/base';
import { adminBaseApi } from '@/store/apis/adminBase';

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    [adminBaseApi.reducerPath]: adminBaseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware, adminBaseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
