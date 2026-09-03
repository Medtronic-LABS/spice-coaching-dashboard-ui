import { ArrowRightIcon, DeleteIcon, SaveDraftIcon } from '@/assets/icon';
import {
  Button,
  Card,
  EmptyState,
  FieldGroupLabel,
  FormLabel,
  LimitedTextInput,
  Loader,
  TruncatedText,
} from '@/components/ui';
import { paths } from '@/constants/routes';
import {
  FIELD_LIMITS,
  TABLE_CELL_LABEL_MAX_LENGTH,
} from '@/constants/fieldLimits';
import { AdminModuleDraftValidationDialog } from '@/features/modules/components/AdminModuleDraftValidationDialog';
import { ModuleSourceDocumentPanel } from '@/features/modules/components/ModuleSourceDocumentPanel';
import {
  ReorderableList,
  ReorderDragHandle,
} from '@/features/modules/components/ReorderableList';
import { RichTextEditor } from '@/features/modules/components/RichTextEditor';
import { useAdminModuleDraftSaveFeedback } from '@/features/modules/hooks/useAdminModuleDraftSaveFeedback';
import { useAdminModuleReviewEditor } from '@/features/modules/hooks/useAdminModuleReviewEditor';
import { useAdminModuleReviewReadonly } from '@/features/modules/hooks/useAdminModuleReviewReadonly';
import { useModulePreview } from '@/features/modules/hooks/useModulePreview';
import {
  selectAdminModuleBaseline,
  insertCardAtIndex,
  markReviewEditorFocused,
  removeCardAtIndex,
  setCards,
  updateCardAtIndex,
} from '@/features/modules/store/adminModuleReviewSlice';
import {
  adjustSelectedIndexAfterReorder,
  cardSortableId,
  createEmptyAdminModuleCard,
  reorderCards,
} from '@/features/modules/utils/adminModuleCardUtils';
import {
  navigateToAdminModuleDraftIssue,
  type AdminModuleDraftFocusLocationState,
} from '@/features/modules/utils/adminModuleDraftIssueNavigation';
import type { AdminModuleCard } from '@/features/modules/types/adminModule.types';
import {
  normalizeAdminModuleCard,
  normalizeCardBody,
} from '@/features/modules/utils/cardBody';
import { focusAdminModuleDraftIssue } from '@/features/modules/utils/focusAdminModuleDraftIssue';
import type { AdminModuleDraftIssue } from '@/features/modules/utils/validateAdminModuleDraftContent';
import {
  DEPLOYMENT_PRIMARY_LOCALE,
  resolveDisplayText,
} from '@/config/deploymentLocale';
import {
  patchLocaleField,
  readLocaleRichBody,
  readLocaleText,
  setLocaleRichBody,
} from '@/types/localized';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

function cardTitle(card: AdminModuleCard): string {
  const title = readLocaleText(card.title, DEPLOYMENT_PRIMARY_LOCALE);
  return title || 'Untitled card';
}

function cardsEqual(a: AdminModuleCard, b: AdminModuleCard): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export const AdminModuleLessonsStep = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { moduleId = '' } = useParams<{ moduleId: string }>();
  const baseline = useAppSelector(selectAdminModuleBaseline);
  const { working, isLoading, error, refetch, isSaving, save, formatError } =
    useAdminModuleReviewEditor(moduleId);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [editorRevision, setEditorRevision] = useState(0);
  const [sourceDocOpen, setSourceDocOpen] = useState(false);
  const previousModuleIdRef = useRef(moduleId);
  const pendingCardFocusRef = useRef<AdminModuleDraftIssue | null>(null);
  const isReadonly = useAdminModuleReviewReadonly();
  const {
    registerEditorContext,
    isOpen: isPreviewOpen,
    closePreview,
  } = useModulePreview();
  const {
    draftIssues,
    draftValidationOpen,
    clearSaveFeedback,
    captureSaveError,
    closeDraftValidation,
  } = useAdminModuleDraftSaveFeedback(formatError);

  const cards = useMemo(
    () =>
      (working?.cards ?? []).map((card, index) =>
        normalizeAdminModuleCard(card, index),
      ),
    [working?.cards],
  );

  const resolveCardIndex = useCallback(
    (issue: AdminModuleDraftIssue) => {
      const byId = cards.findIndex((card) => card.id === issue.itemId);
      if (byId >= 0) return byId;
      if (issue.index >= 0 && issue.index < cards.length) return issue.index;
      return 0;
    },
    [cards],
  );

  const applyCardFocus = useCallback(
    (issue: AdminModuleDraftIssue) => {
      if (!cards.length) {
        pendingCardFocusRef.current = issue;
        return;
      }
      setSelectedIndex(resolveCardIndex(issue));
      pendingCardFocusRef.current = null;
      window.setTimeout(() => focusAdminModuleDraftIssue(issue), 80);
    },
    [cards.length, resolveCardIndex],
  );

  const reviewDraftIssue = useCallback(
    (issue: AdminModuleDraftIssue) => {
      if (issue.kind !== 'card') {
        navigateToAdminModuleDraftIssue({
          navigate,
          moduleId,
          issue,
          onBeforeNavigate: closeDraftValidation,
        });
        return;
      }
      closeDraftValidation();
      applyCardFocus(issue);
    },
    [applyCardFocus, closeDraftValidation, moduleId, navigate],
  );

  useEffect(() => {
    registerEditorContext({ phase: 'card', index: selectedIndex });
  }, [selectedIndex, registerEditorContext]);

  // Preview and source side panels both take horizontal space — only one at a time.
  useEffect(() => {
    if (isPreviewOpen) {
      setSourceDocOpen(false);
    }
  }, [isPreviewOpen]);

  useEffect(() => {
    const state = location.state as AdminModuleDraftFocusLocationState | null;
    const issue = state?.focusDraftIssue;
    if (!issue || issue.kind !== 'card') return;
    pendingCardFocusRef.current = issue;
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    const issue = pendingCardFocusRef.current;
    if (!issue || !cards.length) return;
    applyCardFocus(issue);
  }, [applyCardFocus, cards.length]);

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

  // Only reset selection when the module id actually changes — not on remount
  // when arriving from Quiz/Details with a focus target.
  useEffect(() => {
    if (previousModuleIdRef.current === moduleId) return;
    previousModuleIdRef.current = moduleId;
    pendingCardFocusRef.current = null;
    setSelectedIndex(0);
    setEditorRevision((revision) => revision + 1);
  }, [moduleId]);

  useEffect(() => {
    setSelectedIndex((current) => {
      if (cards.length === 0) return 0;
      return current >= cards.length ? cards.length - 1 : current;
    });
  }, [cards.length]);

  const handleEditorFocus = useCallback(() => {
    dispatch(markReviewEditorFocused());
  }, [dispatch]);

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

  const busy = isSaving;
  const busyLabel = 'Saving module…';
  const cardIsEdited =
    selectedCard && baselineCard
      ? !cardsEqual(selectedCard, baselineCard)
      : false;

  return (
    <section className="space-y-4">
      <Loader open={busy} label={busyLabel} />
      <AdminModuleDraftValidationDialog
        open={draftValidationOpen}
        issues={draftIssues}
        onClose={closeDraftValidation}
        onReviewIssue={reviewDraftIssue}
      />

      <div
        className={`grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] ${
          showSourcePanel
            ? 'xl:grid-cols-[280px_minmax(0,1fr)_minmax(320px,38%)]'
            : ''
        }`}
      >
        <Card variant="elevated" className="space-y-3 p-4">
          <div>
            <FieldGroupLabel>Module</FieldGroupLabel>
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
                        <TruncatedText
                          text={cardTitle(c)}
                          maxChars={TABLE_CELL_LABEL_MAX_LENGTH}
                          focusable
                          className="font-semibold"
                        />
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-spice-text-muted">
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
              <EmptyState title="No cards" />
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
                  onClick={() => {
                    setSourceDocOpen((open) => {
                      if (!open) {
                        closePreview();
                      }
                      return !open;
                    });
                  }}
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
                      clearSaveFeedback();
                      const next = createEmptyAdminModuleCard();
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
                    disabled={busy || !cards.length || !cardIsEdited}
                    onClick={() => {
                      clearSaveFeedback();
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
                  <Button
                    variant="secondary"
                    className="inline-flex h-9 w-9 items-center justify-center p-0 text-spice-semantic-error ring-1 ring-spice-semantic-error/30"
                    disabled={busy || !cards.length}
                    aria-label="Delete card"
                    title="Delete card"
                    onClick={() => {
                      clearSaveFeedback();
                      const idx = selectedIndex;
                      dispatch(removeCardAtIndex({ index: idx }));
                      const nextIndex =
                        idx > 0 ? idx - 1 : Math.max(0, cards.length - 2);
                      setSelectedIndex(nextIndex);
                      setEditorRevision((revision) => revision + 1);
                    }}
                  >
                    <DeleteIcon className="h-4 w-4" />
                  </Button>
                </>
              ) : null}
            </div>
          </div>

          {cards.length && selectedCard ? (
            <>
              <div className="grid gap-3">
                <label
                  className="block space-y-1"
                  data-card-editor-field="title"
                >
                  <FormLabel>Title (BN)</FormLabel>
                  <LimitedTextInput
                    id={`admin-module-card-title-${selectedCard.id}`}
                    value={
                      isReadonly
                        ? readLocaleText(
                            selectedCard.title,
                            DEPLOYMENT_PRIMARY_LOCALE,
                          )
                        : (selectedCard.title[DEPLOYMENT_PRIMARY_LOCALE] ?? '')
                    }
                    maxLength={FIELD_LIMITS.cardTitle}
                    disabled={busy || isReadonly}
                    onFocus={handleEditorFocus}
                    onChange={(value) =>
                      updateSelectedCard({
                        title: patchLocaleField(
                          selectedCard.title,
                          DEPLOYMENT_PRIMARY_LOCALE,
                          value,
                        ),
                      })
                    }
                    placeholder="Bangla title…"
                  />
                </label>
              </div>

              <div className="space-y-1" data-card-editor-field="body">
                <FormLabel>Body/content (BN)</FormLabel>
                <RichTextEditor
                  key={`card-body-${selectedIndex}-${selectedCard.id}-${editorRevision}`}
                  value={selectedBody}
                  onEditorFocus={handleEditorFocus}
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
            <EmptyState title="No cards to edit" />
          )}

          <div className="flex justify-end gap-2">
            {!isReadonly ? (
              <Button
                variant="secondary"
                className="inline-flex h-9 items-center gap-1.5 text-xs"
                disabled={busy}
                onClick={async () => {
                  clearSaveFeedback();
                  try {
                    await save();
                  } catch (err) {
                    captureSaveError(err);
                  }
                }}
              >
                <SaveDraftIcon className="h-3.5 w-3.5" />
                {isSaving ? 'Saving…' : 'Save draft'}
              </Button>
            ) : null}
            <Button
              className="inline-flex h-9 items-center gap-1.5 text-xs"
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
              <ArrowRightIcon className="h-3.5 w-3.5" />
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
