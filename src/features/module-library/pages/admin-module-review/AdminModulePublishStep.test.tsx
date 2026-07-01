import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppRole } from '@/constants/role';
import { paths } from '@/constants/routes';
import { ModulePreviewProvider } from '@/features/module-library/context/ModulePreviewContext';
import { adminModuleReviewReducer } from '@/features/module-library/store/adminModuleReviewSlice';
import {
  baseAdminModuleDetail,
  baseQuizItem,
  emptyCard,
} from '@/features/module-library/utils/fixtures/adminModuleTestFixtures';
import { baseApi } from '@/store/apis/base';
import { AdminModulePublishStep } from './AdminModulePublishStep';

const setClinicallyReviewed = vi.fn(() => ({
  unwrap: vi.fn().mockResolvedValue({ clinically_reviewed: true }),
}));

const mockModule = baseAdminModuleDetail({
  card_count: 1,
  cards: [emptyCard('c1', 'Lesson 1')],
  quiz: [baseQuizItem('q1', 'Question?', 1)],
  module_json: {
    cards: [emptyCard('c1', 'Lesson 1')],
    quiz: [baseQuizItem('q1', 'Question?', 1)],
  },
});

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
      <ModulePreviewProvider moduleId="mod-1">
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
      </ModulePreviewProvider>
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
