import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { AppRole } from '@/constants/role';
import { paths } from '@/constants/routes';
import type { AdminModuleDetailResponse } from '@/features/module-library/api/adminModulesApi';
import { adminModuleReviewReducer } from '@/features/module-library/store/adminModuleReviewSlice';
import { baseApi } from '@/store/apis/base';
import { AdminModulePublishStep } from './AdminModulePublishStep';

const setClinicallyReviewed = vi.fn(() => ({
  unwrap: vi.fn().mockResolvedValue({ clinically_reviewed: true }),
}));

const mockModule: AdminModuleDetailResponse = {
  id: 'mod-1',
  module_family_id: 'family-1',
  version: 1,
  title_bn: 'Module BN',
  title_en: 'Module EN',
  description_bn: 'Description BN',
  description_en: null,
  domain: 'rmnch',
  module_type: 'refresher',
  lifecycle_status: 'draft',
  clinically_reviewed: false,
  has_visibility_window: false,
  card_count: 1,
  estimated_minutes: 5,
  published_at: null,
  created_at: '2026-01-01T00:00:00Z',
  quality_flags: null,
  module_json: { cards: [], quiz: [] },
  cards: [{ id: 'c1', title_bn: 'Lesson 1', body_bn: null }],
  quiz: [
    {
      id: 'q1',
      question_order: 1,
      question_bn: 'Question?',
      question_en: null,
      case_setup_bn: null,
      case_setup_en: null,
      options_bn: ['a'],
      options_en: ['a'],
      correct_indices: [0],
      explanation_bn: null,
      explanation_en: null,
      difficulty: 'medium',
    },
  ],
};

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
      useSetClinicallyReviewedMutation: () => [
        setClinicallyReviewed,
        { isLoading: false },
      ],
    };
  },
);

function renderPublishStep() {
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
      <MemoryRouter
        initialEntries={[
          paths.adminModuleReviewPublish.replace(':moduleId', 'mod-1'),
        ]}
      >
        <Routes>
          <Route
            path={paths.adminModuleReviewPublish}
            element={<AdminModulePublishStep />}
          />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe('AdminModulePublishStep', () => {
  beforeEach(() => {
    roleState.role = 'programManager';
  });

  it('renders publish summary content for draft modules', () => {
    renderPublishStep();

    expect(screen.getByText('Module BN')).toBeInTheDocument();
    expect(screen.getByText('Lesson 1')).toBeInTheDocument();
    expect(screen.getByText('Question?')).toBeInTheDocument();
  });

  it('publishes draft modules via clinically reviewed mutation', async () => {
    const user = userEvent.setup();
    renderPublishStep();

    await user.click(screen.getByRole('button', { name: /↑ publish module/i }));

    expect(setClinicallyReviewed).toHaveBeenCalledWith({
      moduleId: 'mod-1',
      body: { clinically_reviewed: true },
    });
  });
});
