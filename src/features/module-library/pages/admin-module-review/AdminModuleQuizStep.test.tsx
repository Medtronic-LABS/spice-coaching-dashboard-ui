import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { setCurrentRole, type AppRole } from '@/constants/role';
import { paths } from '@/constants/routes';
import {
  baseAdminModuleDetail,
  baseQuizItem,
} from '@/features/module-library/utils/fixtures/adminModuleTestFixtures';
import { ModulePreviewProvider } from '@/features/module-library/context/ModulePreviewContext';
import { adminModuleReviewReducer } from '@/features/module-library/store/adminModuleReviewSlice';
import { baseApi } from '@/store/apis/base';
import { AdminModuleQuizStep } from './AdminModuleQuizStep';

const mockModule = baseAdminModuleDetail({
  lifecycle_status: 'published',
  clinically_reviewed: true,
  quiz: [
    baseQuizItem('q1', 'Question A', 1),
    baseQuizItem('q2', 'Question B', 2),
    baseQuizItem('q3', 'Question C', 3),
  ],
  module_json: {
    cards: [],
    quiz: [
      baseQuizItem('q1', 'Question A', 1),
      baseQuizItem('q2', 'Question B', 2),
      baseQuizItem('q3', 'Question C', 3),
    ],
  },
});

vi.mock('@/features/module-library/hooks/useAdminModuleDetailQuery', () => ({
  useAdminModuleDetailQuery: () => ({
    data: mockModule,
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

function renderQuizStep(role: AppRole = 'programManager') {
  setCurrentRole(role);

  const store = configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      adminModuleReview: adminModuleReviewReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

  const view = render(
    <Provider store={store}>
      <ModulePreviewProvider moduleId="mod-1">
        <MemoryRouter
          initialEntries={[
            paths.adminModuleReviewQuiz.replace(':moduleId', 'mod-1'),
          ]}
        >
          <Routes>
            <Route
              path={paths.adminModuleReviewQuiz}
              element={<AdminModuleQuizStep />}
            />
          </Routes>
        </MemoryRouter>
      </ModulePreviewProvider>
    </Provider>,
  );

  return { store, ...view };
}

describe('AdminModuleQuizStep reorder', () => {
  it('shows drag handles for program manager', () => {
    setCurrentRole('programManager');
    renderQuizStep();

    expect(
      screen.getAllByRole('button', { name: 'Drag to reorder' }),
    ).toHaveLength(3);
  });

  it('hides reorder controls for supervisor read-only role', () => {
    renderQuizStep('supervisor');

    expect(
      screen.queryByRole('button', { name: 'Drag to reorder' }),
    ).not.toBeInTheDocument();
  });
});
