import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setCurrentRole, type AppRole } from '@/constants/role';
import { paths } from '@/constants/routes';
import { ModulePreviewProvider } from '@/features/modules/context/ModulePreviewContext';
import { adminModuleReviewReducer } from '@/features/modules/store/adminModuleReviewSlice';
import {
  baseAdminModuleDetail,
  baseQuizItem,
} from '@/features/modules/utils/fixtures/adminModuleTestFixtures';
import { baseApi } from '@/store/apis/base';
import { AdminModuleQuizStep } from './AdminModuleQuizStep';

function createMockModule(
  quiz = [
    baseQuizItem('q1', 'Question A', 1),
    baseQuizItem('q2', 'Question B', 2),
    baseQuizItem('q3', 'Question C', 3),
  ],
) {
  return baseAdminModuleDetail({
    lifecycle_status: 'draft',
    clinically_reviewed: false,
    quiz,
    module_json: {
      cards: [],
      quiz,
    },
  });
}

let mockModule = createMockModule();

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
  beforeEach(() => {
    mockModule = createMockModule();
  });

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

describe('AdminModuleQuizStep editor UI', () => {
  beforeEach(() => {
    mockModule = createMockModule();
    setCurrentRole('programManager');
  });

  it('shows question labels, correct-answer badge, and bottom add-question CTA', () => {
    renderQuizStep();

    expect(screen.getAllByText('Question')).toHaveLength(3);
    expect(screen.getAllByText('Answer options')).toHaveLength(3);
    expect(screen.getAllByText('Select the correct answer')).toHaveLength(3);
    expect(screen.getAllByText('CORRECT ANSWER')).toHaveLength(3);
    expect(
      screen.getByRole('button', { name: /add question/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /add option/i })).toHaveLength(
      3,
    );
    expect(
      screen.getByRole('button', { name: /save draft/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /continue to review/i }),
    ).toBeInTheDocument();
  });

  it('shows empty state when there are no quiz questions', () => {
    mockModule = createMockModule([]);
    renderQuizStep();

    expect(screen.getByText('No quiz questions yet')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /add question/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /remove all/i }),
    ).not.toBeInTheDocument();
  });

  it('adds a new question with four options from empty state', async () => {
    const user = userEvent.setup();
    mockModule = createMockModule([]);
    const { store } = renderQuizStep();

    await user.click(screen.getByRole('button', { name: /add question/i }));

    const quiz = store.getState().adminModuleReview.working?.quiz ?? [];
    expect(quiz).toHaveLength(1);
    expect(quiz[0]?.options.bn).toEqual(['', '', '', '']);
    expect(screen.getByText('QUESTION 1')).toBeInTheDocument();
  });

  it('duplicates a question immediately after the source', async () => {
    const user = userEvent.setup();
    const { store } = renderQuizStep();

    await user.click(
      screen.getByRole('button', { name: 'Duplicate question 1' }),
    );

    const quiz = store.getState().adminModuleReview.working?.quiz ?? [];
    expect(quiz).toHaveLength(4);
    expect(quiz.map((item) => item.question.bn)).toEqual([
      'Question A',
      'Question A',
      'Question B',
      'Question C',
    ]);
    expect(quiz[1]?.id).not.toBe('q1');
    expect(screen.getByText('QUESTION 4')).toBeInTheDocument();
  });

  it('removes a question and renumbers the remaining items', async () => {
    const user = userEvent.setup();
    const { store } = renderQuizStep();

    await user.click(screen.getByRole('button', { name: 'Remove question 2' }));

    const quiz = store.getState().adminModuleReview.working?.quiz ?? [];
    expect(quiz.map((item) => item.id)).toEqual(['q1', 'q3']);
    expect(quiz.map((item) => item.question_order)).toEqual([1, 2]);
    expect(screen.queryByText('QUESTION 3')).not.toBeInTheDocument();
    expect(screen.getByText('QUESTION 2')).toBeInTheDocument();
  });

  it('keeps Add question below the question list', () => {
    renderQuizStep();

    const addQuestion = screen.getByRole('button', { name: /add question/i });
    const lastQuestion = screen.getByText('QUESTION 3').closest('div');
    expect(lastQuestion).toBeTruthy();
    expect(
      addQuestion.compareDocumentPosition(lastQuestion!) &
        Node.DOCUMENT_POSITION_PRECEDING,
    ).toBeTruthy();
  });

  it('hides edit actions in read-only mode', () => {
    renderQuizStep('supervisor');

    expect(
      screen.queryByRole('button', { name: /add question/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /save draft/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /duplicate question/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Quiz questions')).toBeInTheDocument();
  });
});
