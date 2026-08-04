import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { setCurrentRole } from '@/constants/role';
import { paths } from '@/constants/routes';
import type { AdminModuleDetailResponse } from '@/features/modules/api/adminModulesApi';
import { ModulePreviewProvider } from '@/features/modules/context/ModulePreviewContext';
import { QuizExplanationReviewDialog } from '@/features/modules/components/QuizExplanationReviewDialog';
import { useQuizExplanationReview } from '@/features/modules/hooks/useQuizExplanationReview';
import { adminModuleReviewReducer } from '@/features/modules/store/adminModuleReviewSlice';
import { baseApi } from '@/store/apis/base';
import { AdminModuleQuizStep } from './AdminModuleQuizStep';

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  });
});

const mockModule: AdminModuleDetailResponse = {
  id: 'mod-1',
  module_family_id: 'family-1',
  version: 1,
  title: { bn: 'Module BN', en: 'Module EN' },
  description: null,
  domain: 'rmnch',
  module_type: 'refresher',
  lifecycle_status: 'draft',
  clinically_reviewed: false,
  has_visibility_window: false,
  card_count: 0,
  estimated_minutes: 5,
  published_at: null,
  created_at: '2026-01-01T00:00:00Z',
  quality_flags: null,
  module_json: { cards: [], quiz: [] },
  cards: [],
  quiz: [
    {
      id: 'q1',
      question_order: 1,
      question: { bn: 'Question A' },
      case_setup: null,
      options: { bn: ['a', 'b'] },
      correct_indices: [0],
      explanation: { bn: 'Explanation A' },
      difficulty: 'medium',
    },
    {
      id: 'q2',
      question_order: 2,
      question: { bn: 'Question B' },
      case_setup: null,
      options: { bn: ['a', 'b'] },
      correct_indices: [0],
      explanation: { bn: 'Explanation B' },
      difficulty: 'medium',
    },
  ],
};

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
  const editModuleMock = vi.fn(() => ({
    unwrap: () =>
      Promise.resolve({
        id: 'mod-1',
        module_family_id: 'family-1',
        version: 2,
      }),
  }));
  return {
    ...actual,
    useEditModuleMutation: () => [editModuleMock, { isLoading: false }],
  };
});

function ExplanationReviewDialogHost() {
  const { dialogOpen, handleReviewExplanations } =
    useQuizExplanationReview('mod-1');

  return (
    <QuizExplanationReviewDialog
      open={dialogOpen}
      onReviewExplanations={handleReviewExplanations}
    />
  );
}

function renderQuizStep() {
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
          <ExplanationReviewDialogHost />
          <Routes>
            <Route
              path={paths.adminModuleReviewQuiz}
              element={<AdminModuleQuizStep />}
            />
            <Route
              path={paths.adminModuleReviewPublish}
              element={<div>Review step</div>}
            />
          </Routes>
        </MemoryRouter>
      </ModulePreviewProvider>
    </Provider>,
  );

  return { store, ...view };
}

describe('AdminModuleQuizStep explanation review', () => {
  it('highlights explanation after editing question text and blocks navigation', async () => {
    const user = userEvent.setup();
    renderQuizStep();

    const questionInput = await screen.findByDisplayValue('Question A');
    await user.clear(questionInput);
    await user.type(questionInput, 'Updated question');

    expect(questionInput).toHaveValue('Updated question');
    const explanation = screen.getByDisplayValue('Explanation A');
    expect(explanation.className).toContain('border-spice-semantic-error');

    await user.click(
      screen.getByRole('button', { name: 'Continue to Review' }),
    );

    expect(
      screen.getByRole('dialog', { name: 'Review explanations' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Review step')).not.toBeInTheDocument();
  });

  it('highlights explanation after editing an option', async () => {
    const user = userEvent.setup();
    renderQuizStep();

    const optionInput = await screen.findAllByDisplayValue('a');
    await user.clear(optionInput[0]);
    await user.type(optionInput[0], 'updated option');

    expect(optionInput[0]).toHaveValue('updated option');
    const explanation = screen.getByDisplayValue('Explanation A');
    expect(explanation.className).toContain('border-spice-semantic-error');
  });

  it('highlights explanation after changing the correct option', async () => {
    const user = userEvent.setup();
    renderQuizStep();

    const radios = await screen.findAllByRole('radio');
    expect(radios.length).toBeGreaterThanOrEqual(2);

    // First question has 2 options; pick the second one as correct.
    await user.click(radios[1]);

    const explanation = screen.getByDisplayValue('Explanation A');
    expect(explanation.className).toContain('border-spice-semantic-error');

    await user.click(
      screen.getByRole('button', { name: 'Continue to Review' }),
    );
    expect(
      screen.getByRole('dialog', { name: 'Review explanations' }),
    ).toBeInTheDocument();
  });

  it('focuses the first highlighted explanation from the alert action', async () => {
    const user = userEvent.setup();
    const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus');
    const scrollSpy = vi.spyOn(HTMLElement.prototype, 'scrollIntoView');

    renderQuizStep();

    const questionInput = await screen.findByDisplayValue('Question A');
    await user.clear(questionInput);
    await user.type(questionInput, 'Updated question');

    await user.click(
      screen.getByRole('button', { name: 'Continue to Review' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Review Explanations' }),
    );

    const explanation = screen.getByDisplayValue(
      'Explanation A',
    ) as HTMLTextAreaElement;
    await waitFor(() => {
      expect(scrollSpy).toHaveBeenCalled();
      expect(focusSpy).toHaveBeenCalled();
    });
    expect(document.activeElement).toBe(explanation);
    expect(explanation.selectionStart).toBe(explanation.value.length);
    expect(explanation.selectionEnd).toBe(explanation.value.length);

    focusSpy.mockRestore();
    scrollSpy.mockRestore();
  });

  it('saves directly without showing a review prompt', async () => {
    const user = userEvent.setup();
    renderQuizStep();

    const questionInput = await screen.findByDisplayValue('Question A');
    await user.clear(questionInput);
    await user.type(questionInput, 'Updated question');

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(
      screen.queryByRole('dialog', { name: 'Review explanations' }),
    ).not.toBeInTheDocument();
  });

  it('removes explanation highlight after focusing the explanation field', async () => {
    const user = userEvent.setup();
    renderQuizStep();

    const questionInput = await screen.findByDisplayValue('Question A');
    await user.clear(questionInput);
    await user.type(questionInput, 'Updated question');

    const explanation = screen.getByDisplayValue('Explanation A');
    expect(explanation.className).toContain('border-spice-semantic-error');

    await user.click(explanation);

    expect(explanation.className).not.toContain('border-spice-semantic-error');
  });

  it('saves and navigates when all edited explanations were reviewed', async () => {
    const user = userEvent.setup();
    renderQuizStep();

    const questionInput = await screen.findByDisplayValue('Question A');
    await user.clear(questionInput);
    await user.type(questionInput, 'Updated question');

    await user.click(screen.getByDisplayValue('Explanation A'));
    await user.click(
      screen.getByRole('button', { name: 'Continue to Review' }),
    );

    expect(
      screen.queryByRole('dialog', { name: 'Review explanations' }),
    ).not.toBeInTheDocument();
    expect(await screen.findByText('Review step')).toBeInTheDocument();
  });

  it('only prompts for remaining unreviewed edited questions', async () => {
    const user = userEvent.setup();
    renderQuizStep();

    const questionInputs = await screen.findAllByRole('textbox');
    const questionAInput = questionInputs.find(
      (input) => (input as HTMLInputElement).value === 'Question A',
    );
    expect(questionAInput).toBeDefined();
    await user.clear(questionAInput!);
    await user.type(questionAInput!, 'Updated question A');

    const questionBInput = screen.getByDisplayValue('Question B');
    await user.clear(questionBInput);
    await user.type(questionBInput, 'Updated question B');

    await user.click(screen.getByDisplayValue('Explanation A'));

    await user.click(
      screen.getByRole('button', { name: 'Continue to Review' }),
    );

    expect(
      screen.getByRole('dialog', { name: 'Review explanations' }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Review Explanations' }),
    );

    await waitFor(() => {
      expect(document.activeElement).toBe(
        screen.getByDisplayValue('Explanation B'),
      );
    });
  });
});
