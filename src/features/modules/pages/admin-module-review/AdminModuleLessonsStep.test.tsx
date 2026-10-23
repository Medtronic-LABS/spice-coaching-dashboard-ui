import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { SnackbarProvider } from '@/components/ui/Snackbar/SnackbarProvider';
import { adminModuleReviewPaths, paths } from '@/constants/routes';
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

vi.mock('@/components/ui/rich-text/RichTextEditor', () => ({
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
    <SnackbarProvider>
      <Provider store={store}>
        <ModulePreviewProvider moduleId="mod-1">
          <MemoryRouter
            initialEntries={[adminModuleReviewPaths.lessons('mod-1')]}
          >
            <Routes>
              <Route
                path={paths.adminModuleReviewLessons}
                element={<AdminModuleLessonsStep />}
              />
            </Routes>
          </MemoryRouter>
        </ModulePreviewProvider>
      </Provider>
    </SnackbarProvider>,
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

describe('AdminModuleLessonsStep actions', () => {
  it('shows Save draft, Continue to Quiz, and Delete as icon-only', () => {
    renderLessonsStep();

    expect(
      screen.getByRole('button', { name: /save draft/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /continue to quiz/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Delete card' }),
    ).toBeInTheDocument();
  });

  it('orders Reset card before Delete card', () => {
    renderLessonsStep();

    const reset = screen.getByRole('button', { name: /reset card/i });
    const remove = screen.getByRole('button', { name: 'Delete card' });
    expect(
      reset.compareDocumentPosition(remove) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
