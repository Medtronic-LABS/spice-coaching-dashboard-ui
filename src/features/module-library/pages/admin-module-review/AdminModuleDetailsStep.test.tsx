import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { AppRole } from '@/constants/role';
import { paths } from '@/constants/routes';
import { baseAdminModuleDetail } from '@/features/module-library/utils/fixtures/adminModuleTestFixtures';
import { ModulePreviewProvider } from '@/features/module-library/context/ModulePreviewContext';
import { adminModuleReviewReducer } from '@/features/module-library/store/adminModuleReviewSlice';
import { baseApi } from '@/store/apis/base';
import { AdminModuleDetailsStep } from './AdminModuleDetailsStep';

const roleState = vi.hoisted(() => ({ role: 'programManager' as AppRole }));

vi.mock('@/constants/role', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/constants/role')>();
  return {
    ...actual,
    getCurrentRole: () => roleState.role,
  };
});

const mockModule = baseAdminModuleDetail({
  card_count: 2,
  quality_flags: { flags: ['needs_review'] },
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
  '@/features/module-library/hooks/useAdminModuleThumbnailUpload',
  () => ({
    useAdminModuleThumbnailUpload: () => ({
      fileInputRef: { current: null },
      uploadError: '',
      isUploading: false,
      openFilePicker: vi.fn(),
      handleImageUpload: vi.fn(),
    }),
  }),
);

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

function renderDetailsStep() {
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
            paths.adminModuleReviewDetails.replace(':moduleId', 'mod-1'),
          ]}
        >
          <Routes>
            <Route
              path={paths.adminModuleReviewDetails}
              element={<AdminModuleDetailsStep />}
            />
            <Route
              path={paths.adminModuleReviewLessons}
              element={<div data-testid="lessons-step" />}
            />
          </Routes>
        </MemoryRouter>
      </ModulePreviewProvider>
    </Provider>,
  );

  return { store, ...view };
}

describe('AdminModuleDetailsStep', () => {
  beforeEach(() => {
    roleState.role = 'programManager';
  });

  it('renders module metadata and quality flags', () => {
    renderDetailsStep();

    expect(screen.getByText('Module details')).toBeInTheDocument();
    expect(screen.getByText('needs_review')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Module BN')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Module EN')).toBeInTheDocument();
  });

  it('updates title fields in the review store', async () => {
    const user = userEvent.setup();
    const { store } = renderDetailsStep();

    const bnTitleInput = screen.getByDisplayValue('Module BN');
    await user.clear(bnTitleInput);
    await user.type(bnTitleInput, 'Updated BN');

    expect(store.getState().adminModuleReview.working?.title.bn).toBe(
      'Updated BN',
    );
  });

  it('navigates to the lessons step', async () => {
    const user = userEvent.setup();
    renderDetailsStep();

    await user.click(
      screen.getByRole('button', { name: 'Continue to Lessons' }),
    );
    expect(screen.getByTestId('lessons-step')).toBeInTheDocument();
  });
});
