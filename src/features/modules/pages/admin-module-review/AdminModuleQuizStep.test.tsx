import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { paths } from '@/constants/routes';
import {
  baseAdminModuleDetail,
  baseQuizItem,
} from '@/features/modules/utils/fixtures/adminModuleTestFixtures';
import { ModulePreviewProvider } from '@/features/modules/context/ModulePreviewContext';
import { adminModuleReviewReducer } from '@/features/modules/store/adminModuleReviewSlice';
import { baseApi } from '@/store/apis/base';
import { AdminModuleQuizStep } from './AdminModuleQuizStep';

const mockModule = baseAdminModuleDetail({
  lifecycle_status: 'draft',
  clinically_reviewed: false,
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

vi.mock('@/features/modules/hooks/useAdminModuleDetailQuery', () => ({
  useAdminModuleDetailQuery: () => ({
    data: mockModule,
    isLoading: false,
    isFetching: false,
    error: undefined,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/features/modules/api/adminModulesApi', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('@/features/modules/api/adminModulesApi')
    >();
  return {
    ...actual,
    useEditModuleMutation: () => [vi.fn(), { isLoading: false }],
  };
});

function renderQuizStep() {
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
  it('shows drag handles for draft modules', () => {
    renderQuizStep();

    expect(
      screen.getAllByRole('button', { name: 'Drag to reorder' }),
    ).toHaveLength(3);
  });
});
