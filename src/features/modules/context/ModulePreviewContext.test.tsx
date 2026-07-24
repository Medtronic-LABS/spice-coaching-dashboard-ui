import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';
import {
  DEPLOYMENT_PRIMARY_LOCALE,
  resolveDisplayText,
} from '@/config/deploymentLocale';
import { ModulePreviewProvider } from '@/features/modules/context/ModulePreviewContext';
import { useModulePreview } from '@/features/modules/hooks/useModulePreview';
import {
  adminModuleReviewReducer,
  hydrateFromServer,
  setCards,
} from '@/features/modules/store/adminModuleReviewSlice';
import {
  baseAdminModuleDetail,
  baseQuizItem,
  emptyCard,
} from '@/features/modules/utils/fixtures/adminModuleTestFixtures';
import * as snapshotUtils from '@/features/modules/utils/generateModulePreviewSnapshot';
import { baseApi } from '@/store/apis/base';
import { readLocaleText } from '@/types/localized';

vi.mock('@/features/modules/hooks/usePresignedFileUrl', () => ({
  usePresignedFileUrl: () => ({
    url: null,
    isLoading: false,
    isError: false,
  }),
}));

const baseModule = baseAdminModuleDetail({
  lifecycle_status: 'published',
  clinically_reviewed: true,
  card_count: 2,
  title: { bn: 'Baseline Module', en: 'Baseline Module EN' },
  description: null,
  cards: [emptyCard('c1', 'Card One'), emptyCard('c2', 'Card Two')],
  quiz: [baseQuizItem('q1', 'Question 1', 1)],
  module_json: {
    cards: [emptyCard('c1', 'Card One'), emptyCard('c2', 'Card Two')],
    quiz: [baseQuizItem('q1', 'Question 1', 1)],
  },
});

function PreviewProbe() {
  const preview = useModulePreview();
  return (
    <div>
      <div data-testid="snapshot-title">
        {preview.snapshot?.moduleTitle ?? 'none'}
      </div>
      <div data-testid="card-count">{preview.snapshot?.cards.length ?? 0}</div>
      <div data-testid="position">
        {preview.position.phase}:{preview.position.index}
      </div>
      <div data-testid="sync-error">{preview.syncError ?? ''}</div>
      <button type="button" onClick={() => preview.syncPreview()}>
        Sync
      </button>
      <button
        type="button"
        onClick={() => preview.openPreview({ phase: 'quiz', index: 0 })}
      >
        Open Quiz
      </button>
    </div>
  );
}

function renderPreviewContext(module = baseModule) {
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
      data: module,
    }),
  );

  return render(
    <Provider store={store}>
      <ModulePreviewProvider moduleId="mod-1">
        <PreviewProbe />
      </ModulePreviewProvider>
    </Provider>,
  );
}

describe('ModulePreviewProvider', () => {
  it('seeds snapshot from baseline when module loads', async () => {
    renderPreviewContext();

    await waitFor(() => {
      expect(screen.getByTestId('snapshot-title')).toHaveTextContent(
        'Baseline Module',
      );
    });
    expect(screen.getByTestId('card-count')).toHaveTextContent('2');
  });

  it('does not update snapshot when working changes without sync', async () => {
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

    render(
      <Provider store={store}>
        <ModulePreviewProvider moduleId="mod-1">
          <PreviewProbe />
        </ModulePreviewProvider>
      </Provider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('card-count')).toHaveTextContent('2');
    });

    store.dispatch(setCards([emptyCard('c1', 'Only One')]));

    expect(screen.getByTestId('card-count')).toHaveTextContent('2');
  });

  it('updates snapshot when syncPreview is called', async () => {
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
        data: baseModule,
      }),
    );

    render(
      <Provider store={store}>
        <ModulePreviewProvider moduleId="mod-1">
          <PreviewProbe />
        </ModulePreviewProvider>
      </Provider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('card-count')).toHaveTextContent('2');
    });

    store.dispatch(setCards([emptyCard('c1', 'Only One')]));

    await user.click(screen.getByRole('button', { name: 'Sync' }));

    expect(screen.getByTestId('card-count')).toHaveTextContent('1');
  });

  it('retains previous snapshot and shows error when sync throws', async () => {
    const user = userEvent.setup();
    const spy = vi
      .spyOn(snapshotUtils, 'generateModulePreviewSnapshot')
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
        throw new Error('Sync failed');
      });

    renderPreviewContext();

    await waitFor(() => {
      expect(screen.getByTestId('card-count')).toHaveTextContent('2');
    });

    await user.click(screen.getByRole('button', { name: 'Sync' }));

    expect(screen.getByTestId('sync-error')).toHaveTextContent('Sync failed');
    expect(screen.getByTestId('card-count')).toHaveTextContent('2');

    spy.mockRestore();
  });

  it('opens preview at requested quiz position', async () => {
    const user = userEvent.setup();
    renderPreviewContext();

    await waitFor(() => {
      expect(screen.getByTestId('card-count')).toHaveTextContent('2');
    });

    await user.click(screen.getByRole('button', { name: 'Open Quiz' }));
    expect(screen.getByTestId('position')).toHaveTextContent('quiz:0');
  });

  it('updates preview position when editor context changes while open', async () => {
    function LiveContextProbe() {
      const preview = useModulePreview();
      return (
        <div>
          <div data-testid="position">
            {preview.position.phase}:{preview.position.index}
          </div>
          <button type="button" onClick={() => preview.openPreview()}>
            Open
          </button>
          <button
            type="button"
            onClick={() =>
              preview.registerEditorContext({ phase: 'card', index: 1 })
            }
          >
            Select card 2
          </button>
        </div>
      );
    }

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
        data: baseModule,
      }),
    );

    render(
      <Provider store={store}>
        <ModulePreviewProvider moduleId="mod-1">
          <LiveContextProbe />
        </ModulePreviewProvider>
      </Provider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('position')).toHaveTextContent('card:0');
    });

    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByTestId('position')).toHaveTextContent('card:0');

    await user.click(screen.getByRole('button', { name: 'Select card 2' }));
    expect(screen.getByTestId('position')).toHaveTextContent('card:1');
  });
});
