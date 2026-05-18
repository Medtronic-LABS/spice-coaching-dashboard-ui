import type { ReactElement } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { baseApi } from '@/store/apis/base';
import { adminBaseApi } from '@/store/apis/adminBase';

export function renderWithProviders(
  ui: ReactElement,
  options?: {
    route?: string;
  },
) {
  const store = configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      [adminBaseApi.reducerPath]: adminBaseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(
        baseApi.middleware,
        adminBaseApi.middleware,
      ),
  });

  const route = options?.route ?? '/';

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </Provider>,
  );
}
