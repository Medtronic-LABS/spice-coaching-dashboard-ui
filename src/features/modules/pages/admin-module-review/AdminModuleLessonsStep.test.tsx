import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { paths } from '@/constants/routes';
import {
  baseAdminModuleDetail,
  emptyCard,
} from '@/features/modules/utils/fixtures/adminModuleTestFixtures';
import { ModulePreviewProvider } from '@/features/modules/context/ModulePreviewContext';
import { adminModuleReviewReducer } from '@/features/modules/store/adminModuleReviewSlice';
import { baseApi } from '@/store/apis/base';
import { AdminModuleLessonsStep } from './AdminModuleLessonsStep';

const mockModule = baseAdminModuleDetail({
  lifecycle_status: 'draft',
  clinically_reviewed: false,
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

vi.mock('@/features/modules/components/RichTextEditor', () => ({
  RichTextEditor: () => <div data-testid="rich-text-editor" />,
}));

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

function renderLessonsStep() {
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
  it('shows drag handles for draft modules', () => {
    renderLessonsStep();

    expect(
      screen.getAllByRole('button', { name: 'Drag to reorder' }),
    ).toHaveLength(3);
  });
});
