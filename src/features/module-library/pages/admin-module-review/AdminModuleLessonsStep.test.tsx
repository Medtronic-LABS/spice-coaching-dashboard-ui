import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { setCurrentRole, type AppRole } from '@/constants/role';
import { paths } from '@/constants/routes';
import {
  baseAdminModuleDetail,
  emptyCard,
} from '@/features/module-library/utils/fixtures/adminModuleTestFixtures';
import { ModulePreviewProvider } from '@/features/module-library/context/ModulePreviewContext';
import { adminModuleReviewReducer } from '@/features/module-library/store/adminModuleReviewSlice';
import { baseApi } from '@/store/apis/base';
import { AdminModuleLessonsStep } from './AdminModuleLessonsStep';

const mockModule = baseAdminModuleDetail({
  lifecycle_status: 'published',
  clinically_reviewed: true,
  card_count: 3,
  cards: [
    emptyCard('c1', 'Card One'),
    emptyCard('c2', 'Card Two'),
    emptyCard('c3', 'Card Three'),
  ],
  module_json: {
    cards: [
      emptyCard('c1', 'Card One'),
      emptyCard('c2', 'Card Two'),
      emptyCard('c3', 'Card Three'),
    ],
    quiz: [],
  },
});

vi.mock('@/features/module-library/components/RichTextEditor', () => ({
  RichTextEditor: () => <div data-testid="rich-text-editor" />,
}));

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

function renderLessonsStep(role: AppRole = 'programManager') {
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
            paths.adminModuleReviewLessons.replace(':moduleId', 'mod-1'),
          ]}
        >
          <Routes>
            <Route
              path={paths.adminModuleReviewLessons}
              element={<AdminModuleLessonsStep />}
            />
          </Routes>
        </MemoryRouter>
      </ModulePreviewProvider>
    </Provider>,
  );

  return { store, ...view };
}

describe('AdminModuleLessonsStep reorder', () => {
  it('shows drag handles for program manager', () => {
    setCurrentRole('programManager');
    renderLessonsStep();

    expect(
      screen.getAllByRole('button', { name: 'Drag to reorder' }),
    ).toHaveLength(3);
  });

  it('hides reorder controls for supervisor read-only role', () => {
    renderLessonsStep('supervisor');

    expect(
      screen.queryByRole('button', { name: 'Drag to reorder' }),
    ).not.toBeInTheDocument();
  });
});
