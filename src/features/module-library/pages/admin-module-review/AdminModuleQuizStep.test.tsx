import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { paths } from '@/constants/routes';
import type { AdminModuleDetailResponse } from '@/features/module-library/api/adminModulesApi';
import { adminModuleReviewReducer } from '@/features/module-library/store/adminModuleReviewSlice';
import { baseApi } from '@/store/apis/base';
import { AdminModuleQuizStep } from './AdminModuleQuizStep';

const mockModule: AdminModuleDetailResponse = {
  id: 'mod-1',
  module_family_id: 'family-1',
  version: 1,
  title_bn: 'Module BN',
  title_en: 'Module EN',
  description_bn: null,
  description_en: null,
  domain: 'rmnch',
  module_type: 'refresher',
  lifecycle_status: 'published',
  clinically_reviewed: true,
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
      question_bn: 'Question A',
      question_en: null,
      case_setup_bn: null,
      case_setup_en: null,
      options_bn: ['a', 'b'],
      options_en: ['a', 'b'],
      correct_indices: [0],
      explanation_bn: null,
      explanation_en: null,
      difficulty: 'medium',
    },
    {
      id: 'q2',
      question_order: 2,
      question_bn: 'Question B',
      question_en: null,
      case_setup_bn: null,
      case_setup_en: null,
      options_bn: ['a', 'b'],
      options_en: ['a', 'b'],
      correct_indices: [0],
      explanation_bn: null,
      explanation_en: null,
      difficulty: 'medium',
    },
    {
      id: 'q3',
      question_order: 3,
      question_bn: 'Question C',
      question_en: null,
      case_setup_bn: null,
      case_setup_en: null,
      options_bn: ['a', 'b'],
      options_en: ['a', 'b'],
      correct_indices: [0],
      explanation_bn: null,
      explanation_en: null,
      difficulty: 'medium',
    },
  ],
};

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
    </Provider>,
  );

  return { store, ...view };
}

describe('AdminModuleQuizStep reorder', () => {
  it('moves the first question down and renumbers question_order', async () => {
    const user = userEvent.setup();
    const { store } = renderQuizStep();

    const moveDownButtons = screen.getAllByRole('button', {
      name: 'Move down',
    });
    await user.click(moveDownButtons[0]);

    const quiz = store.getState().adminModuleReview.working?.quiz ?? [];
    expect(quiz.map((item) => item.question_bn)).toEqual([
      'Question B',
      'Question A',
      'Question C',
    ]);
    expect(quiz.map((item) => item.question_order)).toEqual([1, 2, 3]);
  });
});
