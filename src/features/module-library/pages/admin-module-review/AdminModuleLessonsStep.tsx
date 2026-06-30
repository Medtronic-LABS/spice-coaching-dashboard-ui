import { Button, Card, Loader } from '@/components/ui';
import { paths } from '@/constants/routes';
import { ModuleSourceDocumentPanel } from '@/features/module-library/components/ModuleSourceDocumentPanel';
import {
  ReorderableList,
  ReorderDragHandle,
} from '@/features/module-library/components/ReorderableList';
import { RichTextEditor } from '@/features/module-library/components/RichTextEditor';
import { useAdminModuleReviewEditor } from '@/features/module-library/hooks/useAdminModuleReviewEditor';
import { useAdminModuleReviewReadonly } from '@/features/module-library/hooks/useAdminModuleReviewReadonly';
import { useModulePreview } from '@/features/module-library/hooks/useModulePreview';
import {
  selectAdminModuleBaseline,
  insertCardAtIndex,
  removeCardAtIndex,
  setCards,
  updateCardAtIndex,
} from '@/features/module-library/store/adminModuleReviewSlice';
import {
  adjustSelectedIndexAfterReorder,
  cardSortableId,
  reorderCards,
} from '@/features/module-library/utils/adminModuleCardUtils';
import type { AdminModuleCard } from '@/features/module-library/types/adminModule.types';
import {
  hasEnglishCardContent,
  normalizeAdminModuleCard,
  normalizeCardBody,
} from '@/features/module-library/utils/cardBody';
import {
  DEPLOYMENT_PRIMARY_LOCALE,
  resolveDisplayText,
} from '@/config/deploymentLocale';
import {
  patchLocaleField,
  readLocaleFieldValue,
  readLocaleRichBody,
  readLocaleText,
  setLocaleRichBody,
} from '@/types/localized';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function cardTitle(card: AdminModuleCard): string {
  const title = readLocaleText(card.title, 'en', DEPLOYMENT_PRIMARY_LOCALE);
  return title || 'Untitled card';
}

function cardSubtitle(card: AdminModuleCard): string {
  const bn = readLocaleText(card.title, DEPLOYMENT_PRIMARY_LOCALE).trim();
  const en = readLocaleText(card.title, 'en').trim();
  if (bn && en) return bn;
  return '';
}

function safeString(value: string | null | undefined): string {
  return typeof value === 'string' ? value : '';
}

function cardsEqual(a: AdminModuleCard, b: AdminModuleCard): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function createEmptyCard(): AdminModuleCard {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `card-${Date.now()}`;
  return {
    id,
    title: {},
    body: { [DEPLOYMENT_PRIMARY_LOCALE]: normalizeCardBody('') },
    previous_practice: {},
    current_practice: {},
  };
}

export const AdminModuleLessonsStep = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { moduleId = '' } = useParams<{ moduleId: string }>();
  const baseline = useAppSelector(selectAdminModuleBaseline);
  const {
    working,
    isLoading,
    isFetching,
    error,
    refetch,
    isSaving,
    save,
    formatError,
  } = useAdminModuleReviewEditor(moduleId);

  const [actionError, setActionError] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [editorRevision, setEditorRevision] = useState(0);
  const [sourceDocOpen, setSourceDocOpen] = useState(false);
  const isReadonly = useAdminModuleReviewReadonly();
  const { registerEditorContext } = useModulePreview();

  useEffect(() => {
    registerEditorContext({ phase: 'card', index: selectedIndex });
  }, [selectedIndex, registerEditorContext]);

  const cards = useMemo(
    () =>
      (working?.cards ?? []).map((card, index) =>
        normalizeAdminModuleCard(card, index),
      ),
    [working?.cards],
  );

  const baselineCards = useMemo(
    () =>
      (baseline?.cards ?? []).map((card, index) =>
        normalizeAdminModuleCard(card, index),
      ),
    [baseline?.cards],
  );

  const selectedCard = cards[selectedIndex];
  const baselineCard = selectedCard
    ? (baselineCards.find((card) => card.id === selectedCard.id) ??
      baselineCards[selectedIndex])
    : undefined;
  const selectedBody = normalizeCardBody(
    readLocaleRichBody(selectedCard?.body, DEPLOYMENT_PRIMARY_LOCALE),
  );
  const sourceDocuments = working?.source_documents ?? [];
  const hasSourceDocuments = sourceDocuments.length > 0;
  const showSourcePanel = hasSourceDocuments && sourceDocOpen;

  useEffect(() => {
    setSelectedIndex(0);
    setEditorRevision((revision) => revision + 1);
  }, [moduleId]);

  useEffect(() => {
    setSelectedIndex((current) => {
      if (cards.length === 0) return 0;
      return current >= cards.length ? cards.length - 1 : current;
    });
  }, [cards.length]);

  const updateSelectedCard = (patch: Partial<AdminModuleCard>) => {
    if (!selectedCard) return;
    dispatch(
      updateCardAtIndex({
        index: selectedIndex,
        card: { ...selectedCard, ...patch },
      }),
    );
  };

  if (isLoading && !working) {
    return <Loader label="Loading module…" />;
  }

  if (error || !working) {
    return (
      <Card variant="elevated" className="space-y-3 p-6">
        <p className="text-sm text-spice-semantic-error">
          {error ? formatError(error) : 'Module not found.'}
        </p>
        <Button variant="secondary" onClick={() => void refetch()}>
          Retry
        </Button>
      </Card>
    );
  }

  const busy = isFetching || isSaving;
  const showEnglishFields =
    Boolean(readLocaleText(working.title, 'en').trim()) ||
    cards.some((c) => hasEnglishCardContent(c));
  const showCardTitleEn =
    showEnglishFields ||
    (selectedCard ? hasEnglishCardContent(selectedCard) : false);
  const cardIsEdited =
    selectedCard && baselineCard
      ? !cardsEqual(selectedCard, baselineCard)
      : false;

  return (
    <section className="space-y-4">
      {actionError ? (
        <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
          {actionError}
        </div>
      ) : null}

      <div
        className={`grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] ${
          showSourcePanel
            ? 'xl:grid-cols-[280px_minmax(0,1fr)_minmax(320px,38%)]'
            : ''
        }`}
      >
        <Card variant="elevated" className="space-y-3 p-4">
          <div>
            <div className="text-xs font-semibold tracking-wider text-spice-text-muted">
              Module
            </div>
            <div className="mt-1 text-sm font-semibold text-spice-text-primary">
              {resolveDisplayText(working.title)}
            </div>
            <div className="mt-1 text-xs text-spice-text-muted">
              {cards.length} cards · ~{working.estimated_minutes} min
            </div>
          </div>

          <div className="space-y-2 pt-2">
            {cards.length ? (
              <ReorderableList
                items={cards}
                disabled={busy}
                readOnly={isReadonly}
                getItemId={(card, index) => cardSortableId(cards, card, index)}
                onReorder={(fromIndex, toIndex) => {
                  const newCards = reorderCards(cards, fromIndex, toIndex);
                  dispatch(setCards(newCards));
                  const nextSelected = adjustSelectedIndexAfterReorder(
                    selectedIndex,
                    fromIndex,
                    toIndex,
                  );
                  if (nextSelected !== selectedIndex) {
                    setSelectedIndex(nextSelected);
                    setEditorRevision((revision) => revision + 1);
                  }
                }}
                renderItem={(c, idx, controls) => {
                  const baselineMatch = baselineCards.find(
                    (card) => card.id === c.id,
                  );
                  const edited = baselineMatch && !cardsEqual(c, baselineMatch);
                  return (
                    <div className="flex min-w-0 items-center gap-2">
                      {!isReadonly ? (
                        <ReorderDragHandle
                          dragHandleProps={controls.dragHandleProps}
                        />
                      ) : null}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedIndex(idx);
                          setEditorRevision((revision) => revision + 1);
                        }}
                        className={`min-w-0 flex-1 rounded-lg px-2 py-1 text-left text-sm ${
                          selectedIndex === idx
                            ? 'bg-spice-bg-tint text-spice-brand-primary ring-1 ring-spice-border'
                            : 'text-spice-text-medium'
                        }`}
                      >
                        <div className="truncate font-semibold">
                          {cardTitle(c)}
                        </div>
                        {cardSubtitle(c) ? (
                          <div className="truncate text-[11px] text-spice-text-muted">
                            {cardSubtitle(c)}
                          </div>
                        ) : null}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-spice-text-muted">
                          <span>Card {idx + 1}</span>
                          {edited ? (
                            <span className="rounded-full bg-spice-bg-surface px-2 py-0.5 font-semibold ring-1 ring-spice-border">
                              Edited
                            </span>
                          ) : null}
                        </div>
                      </button>
                    </div>
                  );
                }}
              />
            ) : (
              <div className="text-xs text-spice-text-muted">No cards.</div>
            )}
          </div>
        </Card>

        <Card variant="elevated" className="space-y-4 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="text-2xl font-semibold text-spice-text-primary">
                Lesson content
              </div>
              <div className="mt-1 text-xs text-spice-text-muted">
                Editing card {cards.length ? selectedIndex + 1 : 0} of{' '}
                {cards.length}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {hasSourceDocuments ? (
                <Button
                  variant="secondary"
                  className="h-9 text-xs"
                  onClick={() => setSourceDocOpen((open) => !open)}
                >
                  {sourceDocOpen
                    ? 'Hide source'
                    : sourceDocuments.length > 1
                      ? `Show source (${sourceDocuments.length})`
                      : 'Show source'}
                </Button>
              ) : null}
              {!isReadonly ? (
                <>
                  <Button
                    variant="secondary"
                    className="h-9 text-xs"
                    disabled={busy}
                    onClick={() => {
                      setActionError('');
                      const next = createEmptyCard();
                      const insertAt = cards.length ? selectedIndex + 1 : 0;
                      dispatch(
                        insertCardAtIndex({ index: insertAt, card: next }),
                      );
                      setSelectedIndex(insertAt);
                      setEditorRevision((revision) => revision + 1);
                    }}
                  >
                    Add card
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-9 text-xs"
                    disabled={busy || !cards.length}
                    onClick={() => {
                      setActionError('');
                      const idx = selectedIndex;
                      dispatch(removeCardAtIndex({ index: idx }));
                      const nextIndex =
                        idx > 0 ? idx - 1 : Math.max(0, cards.length - 2);
                      setSelectedIndex(nextIndex);
                      setEditorRevision((revision) => revision + 1);
                    }}
                  >
                    Delete card
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-9 text-xs"
                    disabled={busy || !cards.length || !cardIsEdited}
                    onClick={() => {
                      setActionError('');
                      if (baselineCard) {
                        dispatch(
                          updateCardAtIndex({
                            index: selectedIndex,
                            card: baselineCard,
                          }),
                        );
                        setEditorRevision((revision) => revision + 1);
                      }
                    }}
                  >
                    Reset card
                  </Button>
                </>
              ) : null}
            </div>
          </div>

          {cards.length && selectedCard ? (
            <>
              <div
                className={`grid gap-3 ${
                  showCardTitleEn ? 'md:grid-cols-2' : 'md:grid-cols-1'
                }`}
              >
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-spice-text-primary">
                    Title (BN)
                  </span>
                  <input
                    className="h-10 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm"
                    value={safeString(
                      readLocaleFieldValue(
                        selectedCard.title,
                        DEPLOYMENT_PRIMARY_LOCALE,
                      ),
                    )}
                    disabled={busy || isReadonly}
                    onChange={(e) =>
                      updateSelectedCard({
                        title: patchLocaleField(
                          selectedCard.title,
                          DEPLOYMENT_PRIMARY_LOCALE,
                          e.target.value,
                        ),
                      })
                    }
                    placeholder="Bangla title…"
                  />
                </label>
                {showCardTitleEn ? (
                  <label className="block space-y-1">
                    <span className="text-xs font-semibold text-spice-text-primary">
                      Title (EN)
                    </span>
                    <input
                      className="h-10 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm"
                      value={safeString(
                        readLocaleFieldValue(selectedCard.title, 'en'),
                      )}
                      disabled={busy || isReadonly}
                      onChange={(e) =>
                        updateSelectedCard({
                          title: patchLocaleField(
                            selectedCard.title,
                            'en',
                            e.target.value,
                          ),
                        })
                      }
                      placeholder="English title…"
                    />
                  </label>
                ) : null}
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-spice-text-primary">
                  Body/content (BN)
                </span>
                <RichTextEditor
                  key={`card-body-${selectedIndex}-${selectedCard.id}-${editorRevision}`}
                  value={selectedBody}
                  onChange={(body) =>
                    updateSelectedCard({
                      body: setLocaleRichBody(
                        selectedCard.body,
                        DEPLOYMENT_PRIMARY_LOCALE,
                        body,
                      ),
                    })
                  }
                  minHeightClassName="min-h-[220px]"
                  readOnly={isReadonly}
                />
              </div>
            </>
          ) : (
            <div className="text-sm text-spice-text-muted">
              No cards to edit.
            </div>
          )}

          <div className="flex justify-end gap-2">
            {!isReadonly ? (
              <Button
                variant="secondary"
                className="h-9 text-xs"
                disabled={busy}
                onClick={async () => {
                  setActionError('');
                  try {
                    await save();
                  } catch (err) {
                    setActionError(formatError(err));
                  }
                }}
              >
                {isSaving ? 'Saving…' : 'Save'}
              </Button>
            ) : null}
            <Button
              className="h-9 text-xs"
              disabled={busy}
              onClick={() =>
                navigate(
                  paths.adminModuleReviewQuiz.replace(
                    ':moduleId',
                    encodeURIComponent(working.id),
                  ),
                )
              }
            >
              Continue to Quiz
            </Button>
          </div>
        </Card>

        {showSourcePanel ? (
          <ModuleSourceDocumentPanel
            documents={sourceDocuments}
            onClose={() => setSourceDocOpen(false)}
            className="xl:sticky xl:top-4 xl:max-h-[calc(100vh-8rem)] xl:self-start"
          />
        ) : null}
      </div>
    </section>
  );
};
