import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setCurrentRole } from '@/constants/role';
import {
  DEPLOYMENT_PRIMARY_LOCALE,
  resolveDisplayText,
} from '@/config/deploymentLocale';
import { ModulePreviewPanel } from '@/features/module-library/components/module-preview/ModulePreviewPanel';
import { ModulePreviewProvider } from '@/features/module-library/context/ModulePreviewContext';
import {
  adminModuleReviewReducer,
  hydrateFromServer,
  setCards,
} from '@/features/module-library/store/adminModuleReviewSlice';
import {
  baseAdminModuleDetail,
  emptyCard,
} from '@/features/module-library/utils/fixtures/adminModuleTestFixtures';
import * as snapshotUtils from '@/features/module-library/utils/generateModulePreviewSnapshot';
import { baseApi } from '@/store/apis/base';
import { readLocaleText } from '@/types/localized';

vi.mock('@/features/module-library/hooks/usePresignedFileUrl', () => ({
  usePresignedFileUrl: () => ({
    url: null,
    isLoading: false,
    isError: false,
  }),
}));

const baseModule = baseAdminModuleDetail({
  lifecycle_status: 'published',
  clinically_reviewed: true,
  card_count: 1,
  title: { bn: 'Preview Module' },
  description: null,
  cards: [emptyCard('c1', 'Card One')],
  module_json: {
    cards: [emptyCard('c1', 'Card One')],
    quiz: [],
  },
});

function renderPanel(isDirty = false) {
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
      data: baseModule,
    }),
  );

  if (isDirty) {
    store.dispatch(
      setCards([emptyCard('c1', 'Edited Card'), emptyCard('c2', 'Card Two')]),
    );
  }

  return render(
    <Provider store={store}>
      <ModulePreviewProvider moduleId="mod-1">
        <ModulePreviewPanel />
      </ModulePreviewProvider>
    </Provider>,
  );
}

describe('ModulePreviewPanel', () => {
  beforeEach(() => {
    setCurrentRole('programManager');
    vi.restoreAllMocks();
  });

  it('updates preview content when Sync Preview is clicked', async () => {
    const user = userEvent.setup();
    renderPanel(true);

    await waitFor(() => {
      expect(screen.getByText('Card One')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Sync preview' }));

    expect(screen.getByText('Edited Card')).toBeInTheDocument();
  });

  it('shows sync error banner when sync fails', async () => {
    const user = userEvent.setup();
    vi.spyOn(snapshotUtils, 'generateModulePreviewSnapshot')
      .mockImplementationOnce((module) => ({
        moduleTitle: resolveDisplayText(module.title),
        cards: module.cards.map((card, index) => ({
          index,
          title: readLocaleText(card.title, DEPLOYMENT_PRIMARY_LOCALE, 'en'),
          body: [],
        })),
        quiz: [],
        syncedAt: 1,
      }))
      .mockImplementationOnce(() => {
        throw new Error('Preview sync failed');
      });

    renderPanel();

    await waitFor(() => {
      expect(screen.getByText('Card One')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Sync preview' }));

    expect(screen.getByText('Preview sync failed')).toBeInTheDocument();
    expect(screen.getByText('Card One')).toBeInTheDocument();

    vi.restoreAllMocks();
  });

  it('shows stale badge when editor is dirty', async () => {
    renderPanel(true);

    await waitFor(() => {
      expect(screen.getByText('Edits not synced')).toBeInTheDocument();
    });
  });
});
