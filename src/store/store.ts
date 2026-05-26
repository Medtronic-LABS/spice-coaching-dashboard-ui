import { configureStore } from '@reduxjs/toolkit';
import { adminModuleReviewReducer } from '@/features/module-library/store/adminModuleReviewSlice';
import { courseModuleEditReducer } from '@/features/program-manager/store/courseModuleEditSlice';
import { baseApi } from '@/store/apis/base';
import { adminBaseApi } from '@/store/apis/adminBase';

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    [adminBaseApi.reducerPath]: adminBaseApi.reducer,
    adminModuleReview: adminModuleReviewReducer,
    courseModuleEdit: courseModuleEditReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware, adminBaseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
