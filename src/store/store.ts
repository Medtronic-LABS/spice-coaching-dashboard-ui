import { configureStore } from '@reduxjs/toolkit';
import { adminModuleReviewReducer } from '@/features/modules/store/adminModuleReviewSlice';
import { moduleEditReducer } from '@/features/modules/store/moduleEditSlice';
import { baseApi } from '@/store/apis/base';

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    adminModuleReview: adminModuleReviewReducer,
    moduleEdit: moduleEditReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
