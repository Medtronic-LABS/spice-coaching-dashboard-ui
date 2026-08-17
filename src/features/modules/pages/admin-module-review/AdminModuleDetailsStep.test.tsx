import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { AppRole } from '@/constants/role';
import { paths } from '@/constants/routes';
import { baseAdminModuleDetail } from '@/features/modules/utils/fixtures/adminModuleTestFixtures';
import { ModulePreviewProvider } from '@/features/modules/context/ModulePreviewContext';
import {
  adminModuleReviewReducer,
  editableSnapshot,
} from '@/features/modules/store/adminModuleReviewSlice';
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
    uploadError: '',
    isUploading: false,
    uploadThumbnailFile: vi.fn(),
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
    useFetchModuleDomainOptionsQuery: () => ({
      data: ['rmnch', 'clinical'],
      isLoading: false,
    }),
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
    roleState.role = 'programManager';
    mockModule = baseAdminModuleDetail({
      card_count: 2,
      quality_flags: { flags: ['needs_review'] },
    });
  });

  it('renders module metadata and quality flags', () => {
    renderDetailsStep();

    expect(screen.getByText('Module details')).toBeInTheDocument();
    expect(screen.getByText('Domain')).toBeInTheDocument();
    expect(screen.getByText('Domain Type')).toBeInTheDocument();
    expect(screen.getByLabelText(/^domain$/i)).toHaveValue('rmnch');
    expect(screen.getByLabelText(/^domain type$/i)).toHaveValue('clinical');
    expect(screen.getByText('needs_review')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Module BN')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Module EN')).not.toBeInTheDocument();
    expect(screen.getByTitle('Edit domain')).toBeInTheDocument();
    expect(screen.getByTitle('Edit domain type')).toBeInTheDocument();
    expect(screen.getByTitle('Edit estimated minutes')).toBeInTheDocument();
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
    'keeps %s modules read-only for program managers on a direct URL',
    (lifecycleStatus) => {
      mockModule = {
        ...mockModule,
        lifecycle_status: lifecycleStatus,
      };
      renderDetailsStep();

      expect(screen.getByLabelText(/title \(bn\)/i)).toBeDisabled();
      expect(
        screen.queryByRole('button', { name: /save draft/i }),
      ).not.toBeInTheDocument();
      expect(screen.queryByTitle('Edit domain')).not.toBeInTheDocument();
      expect(
        screen.queryByLabelText(/^estimated minutes$/i),
      ).not.toBeInTheDocument();
    },
  );

  it('updates domain, domain type, and estimated minutes in the review store', async () => {
    const user = userEvent.setup();
    const { store } = renderDetailsStep();

    await user.selectOptions(screen.getByLabelText(/^domain$/i), 'clinical');
    await user.selectOptions(
      screen.getByLabelText(/^domain type$/i),
      'digital',
    );
    await user.clear(screen.getByLabelText(/^estimated minutes$/i));
    await user.type(screen.getByLabelText(/^estimated minutes$/i), '20');

    const { working, baseline } = store.getState().adminModuleReview;
    expect(working?.domain).toBe('clinical');
    expect(working?.content_domain).toBe('digital');
    expect(working?.estimated_minutes).toBe(20);
    expect(working).toBeTruthy();
    expect(baseline).toBeTruthy();
    if (!working || !baseline) return;
    expect(editableSnapshot(working)).not.toBe(editableSnapshot(baseline));
  });

  it('disables continue and save when estimated minutes are invalid', async () => {
    const user = userEvent.setup();
    renderDetailsStep();

    await user.clear(screen.getByLabelText(/^estimated minutes$/i));

    expect(screen.getByRole('button', { name: /save draft/i })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Continue to Lessons' }),
    ).toBeDisabled();
  });

  it('navigates to the lessons step', async () => {
    const user = userEvent.setup();
    renderDetailsStep();

    await user.click(
      screen.getByRole('button', { name: 'Continue to Lessons' }),
    );
    expect(screen.getByTestId('lessons-step')).toBeInTheDocument();
  });

  it('shows Save draft CTA for editable drafts', () => {
    renderDetailsStep();

    expect(
      screen.getByRole('button', { name: /save draft/i }),
    ).toBeInTheDocument();
  });

  it('toggles Chatbot FAQs Only on draft modules', async () => {
    const user = userEvent.setup();
    const { store } = renderDetailsStep();

    const checkbox = screen.getByRole('checkbox', {
      name: /Chatbot FAQs Only/i,
    });
    expect(checkbox).not.toBeChecked();
    expect(checkbox).toBeEnabled();

    await user.click(checkbox);

    expect(store.getState().adminModuleReview.working?.chatbot_faqs_only).toBe(
      true,
    );
  });

  it('keeps Chatbot FAQs Only read-only on published modules', () => {
    mockModule = baseAdminModuleDetail({
      card_count: 2,
      lifecycle_status: 'published',
      chatbot_faqs_only: true,
    });
    renderDetailsStep();

    expect(
      screen.getByRole('checkbox', { name: /Chatbot FAQs Only/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole('checkbox', { name: /Chatbot FAQs Only/i }),
    ).toBeChecked();
  });
});
