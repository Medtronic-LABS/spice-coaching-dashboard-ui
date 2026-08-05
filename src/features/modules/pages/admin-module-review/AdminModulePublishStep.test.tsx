import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppRole } from '@/constants/role';
import { paths } from '@/constants/routes';
import { ModulePreviewProvider } from '@/features/modules/context/ModulePreviewContext';
import { adminModuleReviewReducer } from '@/features/modules/store/adminModuleReviewSlice';
import {
  baseAdminModuleDetail,
  baseQuizItem,
  emptyCard,
} from '@/features/modules/utils/fixtures/adminModuleTestFixtures';
import { baseApi } from '@/store/apis/base';
import { AdminModulePublishStep } from './AdminModulePublishStep';

const mockNavigate = vi.fn();

const setClinicallyReviewed = vi.fn(() => ({
  unwrap: vi.fn().mockResolvedValue({ clinically_reviewed: true }),
}));

function createMockModule() {
  return baseAdminModuleDetail({
    card_count: 1,
    cards: [emptyCard('c1', 'Lesson 1')],
    quiz: [baseQuizItem('q1', 'Question?', 1)],
    module_json: {
      cards: [emptyCard('c1', 'Lesson 1')],
      quiz: [baseQuizItem('q1', 'Question?', 1)],
    },
  });
}

let mockModule = createMockModule();

const roleState = vi.hoisted(() => ({ role: 'programManager' as AppRole }));

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom',
    );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/constants/role', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/constants/role')>();
  return {
    ...actual,
    getCurrentRole: () => roleState.role,
  };
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

vi.mock('@/features/modules/api/adminModulesApi', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('@/features/modules/api/adminModulesApi')
    >();
  return {
    ...actual,
    useEditModuleMutation: () => [vi.fn(), { isLoading: false }],
    useSetClinicallyReviewedMutation: () => [
      setClinicallyReviewed,
      { isLoading: false },
    ],
  };
});

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
    mockModule = createMockModule();
    mockNavigate.mockClear();
    setClinicallyReviewed.mockClear();
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

  it('opens assignment from read-only published modules', async () => {
    const user = userEvent.setup();
    mockModule = {
      ...createMockModule(),
      lifecycle_status: 'published',
      clinically_reviewed: true,
    };
    renderPublishStep();

    const assignButton = screen.getByRole('button', { name: 'Assign to CHWs' });
    expect(assignButton).toBeEnabled();

    await user.click(assignButton);

    expect(mockNavigate).toHaveBeenCalledWith(paths.moduleLibrary, {
      state: {
        tab: 'published',
        openAssignment: {
          moduleId: 'mod-1',
          moduleTitle: 'Module BN',
        },
      },
    });
  });

  it('redirects to the published tab after the success modal', async () => {
    const user = userEvent.setup();
    renderPublishStep();

    await user.click(screen.getByRole('button', { name: /↑ publish module/i }));
    expect(
      await screen.findByRole('heading', { name: /module is live/i }),
    ).toBeInTheDocument();

    const dialog = screen.getByRole('dialog');
    await user.click(
      within(dialog).getAllByRole('button', {
        name: /^back to module library$/i,
      })[0],
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(paths.moduleLibrary, {
        state: { tab: 'published' },
      });
    });
  });

  it('shows Save draft for editable drafts', () => {
    renderPublishStep();

    expect(
      screen.getByRole('button', { name: /save draft/i }),
    ).toBeInTheDocument();
  });

  it('hides source document card when none are linked', () => {
    renderPublishStep();

    expect(screen.queryByText('Source document')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /preview source document/i }),
    ).not.toBeInTheDocument();
  });

  it('shows source document card and opens preview panel', async () => {
    const user = userEvent.setup();
    mockModule = {
      ...createMockModule(),
      source_documents: [
        {
          source_document_id: 'doc-1',
          presigned_url:
            'https://example.com/files/bangladesh_htn_protocol_v3.pdf?response-content-disposition=attachment%3B%20filename%3D%22bangladesh_htn_protocol_v3.pdf%22&response-content-type=application%2Fpdf',
          presigned_expires_seconds: 3600,
        },
      ],
    };
    renderPublishStep();

    expect(screen.getByText('Source document')).toBeInTheDocument();
    expect(
      screen.getByText('bangladesh_htn_protocol_v3.pdf'),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /preview source document/i }),
    );

    expect(screen.getByText(/compare with original/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^close$/i }),
    ).toBeInTheDocument();
  });
});
