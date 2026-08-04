import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { paths } from '@/constants/routes';
import { setCurrentRole } from '@/constants/role';
import { AdminModuleReviewLayout } from '@/features/modules/layout/AdminModuleReviewLayout';
import {
  adminModuleReviewReducer,
  hydrateFromServer,
  setCards,
} from '@/features/modules/store/adminModuleReviewSlice';
import {
  baseAdminModuleDetail,
  emptyCard,
} from '@/features/modules/utils/fixtures/adminModuleTestFixtures';
import { baseApi } from '@/store/apis/base';

vi.mock('@/features/modules/hooks/usePresignedFileUrl', () => ({
  usePresignedFileUrl: () => ({
    url: null,
    isLoading: false,
    isError: false,
  }),
}));

vi.mock('@/features/modules/hooks/useAdminModuleReviewNavigation', () => ({
  useAdminModuleReviewNavigation: () => ({
    isDirty: false,
    isSaving: false,
    dialogOpen: false,
    navigateTo: vi.fn(),
    closeDialog: vi.fn(),
    confirmDiscard: vi.fn(),
    confirmSaveAndLeave: vi.fn(),
  }),
}));

const mockModule = baseAdminModuleDetail({
  lifecycle_status: 'published',
  clinically_reviewed: true,
  card_count: 1,
  title: { bn: 'Layout Module' },
  description: null,
  cards: [emptyCard('c1', 'Card One')],
  module_json: {
    cards: [emptyCard('c1', 'Card One')],
    quiz: [],
  },
});

const editableMockModule = {
  ...mockModule,
  lifecycle_status: 'draft' as const,
  clinically_reviewed: false,
};

function StepStub() {
  return <div data-testid="editor-step">Editor step</div>;
}

function renderLayout(
  role: 'programManager' | 'supervisor' = 'programManager',
) {
  setCurrentRole(role);

  const store = configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      adminModuleReview: adminModuleReviewReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

  store.dispatch(
    hydrateFromServer({
      moduleId: 'mod-1',
      data: mockModule,
    }),
  );

  const detailsPath = paths.adminModuleReviewDetails.replace(
    ':moduleId',
    'mod-1',
  );

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[detailsPath]}>
        <Routes>
          <Route
            path={paths.adminModuleReview}
            element={<AdminModuleReviewLayout />}
          >
            <Route path="details" element={<StepStub />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe('AdminModuleReviewLayout preview integration', () => {
  beforeEach(() => {
    setCurrentRole('programManager');
  });

  it('opens and closes preview from the layout toggle', async () => {
    const user = userEvent.setup();
    renderLayout();

    await waitFor(() => {
      expect(screen.getByTestId('editor-step')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Preview' }));
    expect(screen.getByText('Module Preview')).toBeInTheDocument();
    expect(screen.getByText('Card One')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Hide preview' }));
    expect(screen.queryByText('Card One')).not.toBeInTheDocument();
  });

  it('updates preview when Sync preview is clicked', async () => {
    const user = userEvent.setup();
    const store = configureStore({
      reducer: {
        [baseApi.reducerPath]: baseApi.reducer,
        adminModuleReview: adminModuleReviewReducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(baseApi.middleware),
    });

    store.dispatch(
      hydrateFromServer({
        moduleId: 'mod-1',
        data: editableMockModule,
      }),
    );

    store.dispatch(setCards([emptyCard('c1', 'Updated Card')]));

    const detailsPath = paths.adminModuleReviewDetails.replace(
      ':moduleId',
      'mod-1',
    );

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[detailsPath]}>
          <Routes>
            <Route
              path={paths.adminModuleReview}
              element={<AdminModuleReviewLayout />}
            >
              <Route path="details" element={<StepStub />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </Provider>,
    );

    await user.click(screen.getByRole('button', { name: 'Preview' }));
    expect(screen.getByText('Card One')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sync preview' }));
    expect(screen.getByText('Updated Card')).toBeInTheDocument();
  });

  it('hides Sync preview for supervisor read-only role', async () => {
    const user = userEvent.setup();
    renderLayout('supervisor');

    await user.click(screen.getByRole('button', { name: 'Preview' }));
    expect(screen.getByText('Module Preview')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Sync preview' }),
    ).not.toBeInTheDocument();
  });
});
