import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { paths } from '@/constants/routes';
import { setCurrentRole } from '@/constants/role';
import { ModulePreviewPanel } from '@/features/modules/components/module-preview/ModulePreviewPanel';
import { ModulePreviewProvider } from '@/features/modules/context/ModulePreviewContext';
import { useModulePreview } from '@/features/modules/hooks/useModulePreview';
import {
  adminModuleReviewReducer,
  setQuiz,
} from '@/features/modules/store/adminModuleReviewSlice';
import { reorderQuizItems } from '@/features/modules/utils/adminModuleQuizUtils';
import {
  baseAdminModuleDetail,
  baseQuizItem,
} from '@/features/modules/utils/fixtures/adminModuleTestFixtures';
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

vi.mock('@/features/modules/hooks/usePresignedFileUrl', () => ({
  usePresignedFileUrl: () => ({
    url: null,
    isLoading: false,
    isError: false,
  }),
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

function PreviewHarness() {
  const { openPreview } = useModulePreview();

  return (
    <>
      <AdminModuleQuizStep />
      <button type="button" onClick={() => openPreview()}>
        Open preview
      </button>
      <ModulePreviewPanel />
    </>
  );
}

function renderQuizPreview() {
  setCurrentRole('programManager');

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
              element={<PreviewHarness />}
            />
          </Routes>
        </MemoryRouter>
      </ModulePreviewProvider>
    </Provider>,
  );

  return { store, ...view };
}

describe('AdminModuleQuizStep preview integration', () => {
  beforeEach(() => {
    setCurrentRole('programManager');
  });

  it('opens preview at the focused quiz question', async () => {
    const user = userEvent.setup();
    renderQuizPreview();

    await waitFor(() => {
      expect(
        screen.getAllByPlaceholderText('Type your question…'),
      ).toHaveLength(3);
    });

    const questionInputs = screen.getAllByPlaceholderText(
      'Type your question…',
    );
    await user.click(questionInputs[1]!);
    await user.click(screen.getByRole('button', { name: 'Open preview' }));

    expect(screen.getByText('Question B')).toBeInTheDocument();
    expect(screen.getAllByText('Question 2/3')).toHaveLength(2);
  });

  it('updates quiz order in preview after reorder and sync', async () => {
    const user = userEvent.setup();
    const { store } = renderQuizPreview();

    await waitFor(() => {
      expect(
        screen.getAllByPlaceholderText('Type your question…'),
      ).toHaveLength(3);
    });

    const quiz = store.getState().adminModuleReview.working?.quiz ?? [];
    store.dispatch(setQuiz(reorderQuizItems(quiz, 0, 1)));

    await user.click(screen.getByRole('button', { name: 'Open preview' }));
    const preview = screen.getByTestId('quiz-question-preview-screen');
    expect(within(preview).getByText('Question A')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sync preview' }));
    expect(
      within(screen.getByTestId('quiz-question-preview-screen')).getByText(
        'Question B',
      ),
    ).toBeInTheDocument();
  });
});
