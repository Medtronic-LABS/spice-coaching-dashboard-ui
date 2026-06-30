import type { ReactElement } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { adminModuleReviewReducer } from '@/features/module-library/store/adminModuleReviewSlice';
import { courseModuleEditReducer } from '@/features/program-manager/store/courseModuleEditSlice';
import { baseApi } from '@/store/apis/base';

export function renderWithProviders(
  ui: ReactElement,
  options?: {
    route?: string;
  },
) {
  const store = configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      adminModuleReview: adminModuleReviewReducer,
      courseModuleEdit: courseModuleEditReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

  const route = options?.route ?? '/';

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </Provider>,
  );
}
