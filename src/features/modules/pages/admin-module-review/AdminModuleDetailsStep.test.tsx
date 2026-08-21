import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { AppRole } from '@/constants/role';
import { FIELD_LIMITS } from '@/constants/fieldLimits';
import { paths } from '@/constants/routes';
import { ModulePreviewProvider } from '@/features/modules/context/ModulePreviewContext';
import {
  adminModuleReviewReducer,
  editableSnapshot,
} from '@/features/modules/store/adminModuleReviewSlice';
import { MAX_ESTIMATED_MINUTES_DIGITS } from '@/features/modules/utils/estimatedMinutesValidation';
import { baseAdminModuleDetail } from '@/features/modules/utils/fixtures/adminModuleTestFixtures';
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

  it('sizes domain, domain type, and estimated minutes to content with overflow ellipsis', () => {
    renderDetailsStep();

    const domain = screen.getByLabelText(/^domain$/i);
    const domainType = screen.getByLabelText(/^domain type$/i);
    const estimatedMinutes = screen.getByLabelText(/^estimated minutes$/i);

    expect(domain).toHaveClass('truncate');
    expect(domainType).toHaveClass('truncate');
    expect(estimatedMinutes).toHaveClass('truncate');
    expect(domain).not.toHaveClass('w-[13.5rem]');
    expect(domainType).not.toHaveClass('w-[13.5rem]');
    expect(estimatedMinutes).not.toHaveClass('w-[13.5rem]');
    expect(domain.closest('[class*="max-w-[13.5rem]"]')).not.toBeNull();
    expect(domainType.closest('[class*="max-w-[13.5rem]"]')).not.toBeNull();
    expect(
      estimatedMinutes.closest('[class*="max-w-[13.5rem]"]'),
    ).not.toBeNull();
  });

  it('truncates long read-only domain, domain type, and estimated minutes', () => {
    mockModule = baseAdminModuleDetail({
      lifecycle_status: 'published',
      domain:
        'community based hypertension counselling across upazila health complexes',
      estimated_minutes: 45,
    });
    renderDetailsStep();

    const domain = screen.getByText(
      'Community Based Hypertension Counselling Across Upazila Health Complexes',
    );
    const domainType = screen.getByText('Clinical');
    const estimatedMinutes = screen.getByText('45 minutes');

    expect(domain).toHaveClass('truncate');
    expect(domainType).toHaveClass('truncate');
    expect(estimatedMinutes).toHaveClass('truncate');
    expect(domain.closest('[class*="max-w-[13.5rem]"]')).not.toBeNull();
    expect(domainType.closest('[class*="max-w-[13.5rem]"]')).not.toBeNull();
    expect(
      estimatedMinutes.closest('[class*="max-w-[13.5rem]"]'),
    ).not.toBeNull();
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

  it('lets the user type a new domain after choosing Enter new', async () => {
    const user = userEvent.setup();
    const { store } = renderDetailsStep();

    await user.selectOptions(screen.getByLabelText(/^domain$/i), 'Enter new…');
    const customInput = screen.getByLabelText(/^new domain$/i);
    expect(customInput).toHaveAttribute(
      'maxLength',
      String(FIELD_LIMITS.taxonomy),
    );
    expect(screen.getByText(`0/${FIELD_LIMITS.taxonomy}`)).toBeInTheDocument();
    await user.type(customInput, 'Hypertension');

    expect(customInput).toHaveValue('Hypertension');
    expect(store.getState().adminModuleReview.working?.domain).toBe(
      'Hypertension',
    );
  });

  it('blocks a third digit in estimated minutes', async () => {
    const user = userEvent.setup();
    const { store } = renderDetailsStep();

    const input = screen.getByLabelText(/^estimated minutes$/i);
    expect(input).toHaveAttribute(
      'maxLength',
      String(MAX_ESTIMATED_MINUTES_DIGITS),
    );
    await user.clear(input);
    await user.type(input, '999');

    expect(input).toHaveValue('99');
    expect(store.getState().adminModuleReview.working?.estimated_minutes).toBe(
      99,
    );
    expect(
      screen.getByText(/estimated minutes cannot exceed 60\./i),
    ).toBeInTheDocument();
  });

  it('caps module description at the field limit', () => {
    renderDetailsStep();

    const description = screen.getByLabelText(/description \(bn\)/i);
    expect(description).toHaveAttribute(
      'maxLength',
      String(FIELD_LIMITS.description),
    );
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
