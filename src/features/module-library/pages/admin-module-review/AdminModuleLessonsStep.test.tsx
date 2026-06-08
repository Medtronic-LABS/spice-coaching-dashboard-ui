import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { setCurrentRole } from '@/constants/role';
import { paths } from '@/constants/routes';
import type { AdminModuleDetailResponse } from '@/features/module-library/api/adminModulesApi';
import { adminModuleReviewReducer } from '@/features/module-library/store/adminModuleReviewSlice';
import { baseApi } from '@/store/apis/base';
import { AdminModuleLessonsStep } from './AdminModuleLessonsStep';

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
  card_count: 3,
  estimated_minutes: 5,
  published_at: null,
  created_at: '2026-01-01T00:00:00Z',
  quality_flags: null,
  module_json: { cards: [], quiz: [] },
  cards: [
    { id: 'c1', title_bn: 'Card One', body_bn: null },
    { id: 'c2', title_bn: 'Card Two', body_bn: null },
    { id: 'c3', title_bn: 'Card Three', body_bn: null },
  ],
  quiz: [],
};

vi.mock('@/features/module-library/components/RichTextEditor', () => ({
  RichTextEditor: () => <div data-testid="rich-text-editor" />,
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

function renderLessonsStep() {
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
          paths.adminModuleReviewLessons.replace(':moduleId', 'mod-1'),
        ]}
      >
        <Routes>
          <Route
            path={paths.adminModuleReviewLessons}
            element={<AdminModuleLessonsStep />}
          />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );

  return { store, ...view };
}

describe('AdminModuleLessonsStep reorder', () => {
  it('moves the first card down via Move Down control', async () => {
    setCurrentRole('programManager');
    const user = userEvent.setup();
    const { store } = renderLessonsStep();

    const moveDownButtons = screen.getAllByRole('button', {
      name: 'Move down',
    });
    await user.click(moveDownButtons[0]);

    const cards = store.getState().adminModuleReview.working?.cards ?? [];
    expect(cards.map((card) => card.title_bn)).toEqual([
      'Card Two',
      'Card One',
      'Card Three',
    ]);
  });

  it('hides reorder controls for supervisor read-only role', () => {
    setCurrentRole('supervisor');
    renderLessonsStep();

    expect(
      screen.queryByRole('button', { name: 'Move down' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Drag to reorder' }),
    ).not.toBeInTheDocument();
  });
});
