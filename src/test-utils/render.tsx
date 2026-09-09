import type { ReactElement } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SnackbarProvider } from '@/components/ui/Snackbar/SnackbarProvider';
import { adminModuleReviewReducer } from '@/features/modules/store/adminModuleReviewSlice';
import { moduleEditReducer } from '@/features/modules/store/moduleEditSlice';
import { baseApi } from '@/store/apis/base';

export function renderWithSnackbar(ui: ReactElement) {
  return render(<SnackbarProvider>{ui}</SnackbarProvider>);
}

export function renderWithProviders(
  ui: ReactElement,
  options?: {
    route?: string;
    routerState?: unknown;
  },
) {
  const store = configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      adminModuleReview: adminModuleReviewReducer,
      moduleEdit: moduleEditReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

  const route = options?.route ?? '/';
  const initialEntry =
    options?.routerState !== undefined
      ? { pathname: route, state: options.routerState }
      : route;

  return render(
    <Provider store={store}>
      <SnackbarProvider>
        <MemoryRouter initialEntries={[initialEntry]}>{ui}</MemoryRouter>
      </SnackbarProvider>
    </Provider>,
  );
}
