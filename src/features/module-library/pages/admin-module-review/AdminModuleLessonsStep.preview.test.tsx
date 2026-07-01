import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { paths } from '@/constants/routes';
import { setCurrentRole } from '@/constants/role';
import { ModulePreviewPanel } from '@/features/module-library/components/module-preview/ModulePreviewPanel';
import { ModulePreviewProvider } from '@/features/module-library/context/ModulePreviewContext';
import { useModulePreview } from '@/features/module-library/hooks/useModulePreview';
import { adminModuleReviewReducer } from '@/features/module-library/store/adminModuleReviewSlice';
import {
  baseAdminModuleDetail,
  emptyCard,
} from '@/features/module-library/utils/fixtures/adminModuleTestFixtures';
import { baseApi } from '@/store/apis/base';
import { AdminModuleLessonsStep } from './AdminModuleLessonsStep';

const mockModule = baseAdminModuleDetail({
  lifecycle_status: 'published',
  clinically_reviewed: true,
  card_count: 3,
  cards: [
    emptyCard('c1', 'Card One'),
    emptyCard('c2', 'Card Two'),
    emptyCard('c3', 'Card Three'),
  ],
  module_json: {
    cards: [
      emptyCard('c1', 'Card One'),
      emptyCard('c2', 'Card Two'),
      emptyCard('c3', 'Card Three'),
    ],
    quiz: [],
  },
});

vi.mock('@/features/module-library/components/RichTextEditor', () => ({
  RichTextEditor: () => <div data-testid="rich-text-editor" />,
}));

vi.mock('@/features/module-library/hooks/usePresignedFileUrl', () => ({
  usePresignedFileUrl: () => ({
    url: null,
    isLoading: false,
    isError: false,
  }),
}));

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

function PreviewHarness() {
  const { openPreview } = useModulePreview();

  return (
    <>
      <AdminModuleLessonsStep />
      <button type="button" onClick={() => openPreview()}>
        Open preview
      </button>
      <ModulePreviewPanel />
    </>
  );
}

function renderLessonsPreview() {
  setCurrentRole('programManager');

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
            paths.adminModuleReviewLessons.replace(':moduleId', 'mod-1'),
          ]}
        >
          <Routes>
            <Route
              path={paths.adminModuleReviewLessons}
              element={<PreviewHarness />}
            />
          </Routes>
        </MemoryRouter>
      </ModulePreviewProvider>
    </Provider>,
  );
}

describe('AdminModuleLessonsStep preview integration', () => {
  beforeEach(() => {
    setCurrentRole('programManager');
  });

  it('opens preview at the selected card', async () => {
    const user = userEvent.setup();
    renderLessonsPreview();

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Card One/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Card Three/i }));
    await user.click(screen.getByRole('button', { name: 'Open preview' }));

    const preview = screen.getByTestId('lesson-card-preview-screen');
    expect(
      within(preview).getByRole('heading', { level: 2, name: 'Card Three' }),
    ).toBeInTheDocument();
  });

  it('jumps preview to the clicked card when preview is already open', async () => {
    const user = userEvent.setup();
    renderLessonsPreview();

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Card One/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Open preview' }));
    expect(
      within(screen.getByTestId('lesson-card-preview-screen')).getByRole(
        'heading',
        {
          level: 2,
          name: 'Card One',
        },
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Card Three/i }));
    expect(
      within(screen.getByTestId('lesson-card-preview-screen')).getByRole(
        'heading',
        {
          level: 2,
          name: 'Card Three',
        },
      ),
    ).toBeInTheDocument();
  });

  it('keeps preview stale until sync after editing card title', async () => {
    const user = userEvent.setup();
    renderLessonsPreview();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Bangla title…')).toBeInTheDocument();
    });

    const titleInput = screen.getByPlaceholderText('Bangla title…');
    await user.clear(titleInput);
    await user.type(titleInput, 'Edited Card One');

    await user.click(screen.getByRole('button', { name: 'Open preview' }));
    const preview = screen.getByTestId('lesson-card-preview-screen');
    expect(
      within(preview).getByRole('heading', { level: 2, name: 'Card One' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sync preview' }));
    expect(
      within(screen.getByTestId('lesson-card-preview-screen')).getByRole(
        'heading',
        {
          level: 2,
          name: 'Edited Card One',
        },
      ),
    ).toBeInTheDocument();
  });
});
