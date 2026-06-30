import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { AppRole } from '@/constants/role';
import { paths } from '@/constants/routes';
import { AdminModuleReviewLayout } from '@/features/module-library/layout/AdminModuleReviewLayout';
import { adminModuleReviewReducer } from '@/features/module-library/store/adminModuleReviewSlice';
import { baseApi } from '@/store/apis/base';

const roleState = vi.hoisted(() => ({ role: 'programManager' as AppRole }));

vi.mock('@/constants/role', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/constants/role')>();
  return {
    ...actual,
    getCurrentRole: () => roleState.role,
  };
});

vi.mock('@/features/module-library/hooks/useAdminModuleDetailQuery', () => ({
  useAdminModuleDetailQuery: () => ({
    data: undefined,
    isLoading: false,
    isFetching: false,
    error: undefined,
    refetch: vi.fn(),
  }),
}));

vi.mock(
  '@/features/module-library/api/adminModulesApi',
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import('@/features/module-library/api/adminModulesApi')
      >();
    return {
      ...actual,
      useEditModuleMutation: () => [vi.fn(), { isLoading: false }],
    };
  },
);

function renderLayout(initialPath: string) {
  const store = configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      adminModuleReview: adminModuleReviewReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route
            path={paths.adminModuleReviewDetails}
            element={<AdminModuleReviewLayout />}
          >
            <Route index element={<div data-testid="details-outlet" />} />
          </Route>
          <Route
            path={paths.adminModuleReviewLessons}
            element={<AdminModuleReviewLayout />}
          >
            <Route index element={<div data-testid="lessons-outlet" />} />
          </Route>
          <Route
            path={paths.moduleLibrary}
            element={<div data-testid="module-library" />}
          />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe('AdminModuleReviewLayout', () => {
  beforeEach(() => {
    roleState.role = 'programManager';
  });

  it('highlights the active review step from the current route', () => {
    renderLayout(paths.adminModuleReviewDetails.replace(':moduleId', 'mod-1'));

    expect(screen.getByRole('button', { name: /module details/i })).toHaveClass(
      'bg-spice-brand-pm',
    );
    expect(screen.getByTestId('details-outlet')).toBeInTheDocument();
  });

  it('shows read-only badge for supervisors', () => {
    roleState.role = 'supervisor';
    renderLayout(paths.adminModuleReviewDetails.replace(':moduleId', 'mod-1'));

    expect(screen.getByText('Read-only review')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /review$/i }),
    ).toBeInTheDocument();
  });

  it('navigates between review steps', async () => {
    const user = userEvent.setup();
    renderLayout(paths.adminModuleReviewDetails.replace(':moduleId', 'mod-1'));

    await user.click(screen.getByRole('button', { name: /lessons/i }));
    expect(screen.getByTestId('lessons-outlet')).toBeInTheDocument();
  });
});
