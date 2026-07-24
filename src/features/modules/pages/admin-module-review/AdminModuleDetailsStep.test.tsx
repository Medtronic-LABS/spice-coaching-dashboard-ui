import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { paths } from '@/constants/routes';
import { baseAdminModuleDetail } from '@/features/modules/utils/fixtures/adminModuleTestFixtures';
import { ModulePreviewProvider } from '@/features/modules/context/ModulePreviewContext';
import { adminModuleReviewReducer } from '@/features/modules/store/adminModuleReviewSlice';
import { baseApi } from '@/store/apis/base';
import { AdminModuleDetailsStep } from './AdminModuleDetailsStep';

let mockModule = baseAdminModuleDetail({
  card_count: 2,
  quality_flags: { flags: ['needs_review'] },
});

vi.mock('@/features/modules/hooks/useAdminModuleDetailQuery', () => ({
  useAdminModuleDetailQuery: () => ({
    data: mockModule,
    isLoading: false,
    isFetching: false,
    error: undefined,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/features/modules/hooks/useAdminModuleThumbnailUpload', () => ({
  useAdminModuleThumbnailUpload: () => ({
    fileInputRef: { current: null },
    uploadError: '',
    isUploading: false,
    openFilePicker: vi.fn(),
    handleImageUpload: vi.fn(),
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
    mockModule = baseAdminModuleDetail({
      card_count: 2,
      quality_flags: { flags: ['needs_review'] },
    });
  });

  it('renders module metadata and quality flags', () => {
    renderDetailsStep();

    expect(screen.getByText('Module details')).toBeInTheDocument();
    expect(screen.getByText('needs_review')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Module BN')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Module EN')).not.toBeInTheDocument();
  });

  it('updates title fields in the review store', async () => {
    const user = userEvent.setup();
    const { store } = renderDetailsStep();

    await user.clear(screen.getByDisplayValue('Module BN'));
    await user.type(screen.getByLabelText(/title \(bn\)/i), 'Updated BN');

    expect(store.getState().adminModuleReview.working?.title.bn).toBe(
      'Updated BN',
    );
  });

  it.each(['published', 'deactivated'] as const)(
    'keeps %s modules read-only on a direct URL',
    (lifecycleStatus) => {
      mockModule = {
        ...mockModule,
        lifecycle_status: lifecycleStatus,
      };
      renderDetailsStep();

      expect(screen.getByLabelText(/title \(bn\)/i)).toBeDisabled();
      expect(
        screen.queryByRole('button', { name: /^save$/i }),
      ).not.toBeInTheDocument();
    },
  );

  it('navigates to the lessons step', async () => {
    const user = userEvent.setup();
    renderDetailsStep();

    await user.click(
      screen.getByRole('button', { name: 'Continue to Lessons' }),
    );
    expect(screen.getByTestId('lessons-step')).toBeInTheDocument();
  });
});
