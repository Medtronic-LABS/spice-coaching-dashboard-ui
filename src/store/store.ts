import { configureStore } from '@reduxjs/toolkit';
import { adminModuleReviewReducer } from '@/features/module-library/store/adminModuleReviewSlice';
import { courseModuleEditReducer } from '@/features/program-manager/store/courseModuleEditSlice';
import { baseApi } from '@/store/apis/base';

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    adminModuleReview: adminModuleReviewReducer,
    courseModuleEdit: courseModuleEditReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
