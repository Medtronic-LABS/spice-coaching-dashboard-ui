import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRightIcon,
  CopyIcon,
  DeleteIcon,
  SaveDraftIcon,
} from '@/assets/icon';
import { Button, Card, Loader } from '@/components/ui';
import { paths } from '@/constants/routes';
import type { AdminModuleQuizItem } from '@/features/modules/api/adminModulesApi';
import {
  ReorderableList,
  ReorderDragHandle,
} from '@/features/modules/components/ReorderableList';
import { useAdminModuleReviewEditor } from '@/features/modules/hooks/useAdminModuleReviewEditor';
import { useAdminModuleReviewReadonly } from '@/features/modules/hooks/useAdminModuleReviewReadonly';
import { useModulePreview } from '@/features/modules/hooks/useModulePreview';
import { useQuizExplanationReview } from '@/features/modules/hooks/useQuizExplanationReview';
import {
  setQuiz,
  clearExplanationReviewAcknowledgement,
} from '@/features/modules/store/adminModuleReviewSlice';
import {
  addQuizItem,
  clampCorrectIndex,
  clearAllQuizItems,
  duplicateQuizItem,
  removeQuizItem,
  reorderQuizItems,
  sortQuizItems,
  updateQuizItem,
} from '@/features/modules/utils/adminModuleQuizUtils';
import { useAppDispatch } from '@/store/hooks';
import {
  DEPLOYMENT_PRIMARY_LOCALE,
  resolveDisplayText,
} from '@/config/deploymentLocale';
import {
  patchLocaleField,
  readLocaleOptions,
  readLocaleText,
  setLocaleOptions,
} from '@/types/localized';

// Quiz editing is BN-only for now. EN UI is intentionally hidden.

export const AdminModuleQuizStep = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { moduleId = '' } = useParams<{ moduleId: string }>();
  const {
    working,
    isLoading,
    isFetching,
    error,
    refetch,
    isSaving,
    save,
    formatError,
    isDirty,
  } = useAdminModuleReviewEditor(moduleId);

  const [actionError, setActionError] = useState('');
  const [focusedQuizIndex, setFocusedQuizIndex] = useState(0);
  const scrollToQuestionIdRef = useRef<string | null>(null);
  const isReadonly = useAdminModuleReviewReadonly();
  const { registerEditorContext } = useModulePreview();
  const { pendingIds, validateBeforeProceed, acknowledgeReview } =
    useQuizExplanationReview(moduleId);
  const pendingReviewSet = useMemo(() => new Set(pendingIds), [pendingIds]);

  const sortedQuiz = useMemo(
    () => (working ? sortQuizItems(working.quiz) : []),
    [working],
  );

  useEffect(() => {
    registerEditorContext({ phase: 'quiz', index: focusedQuizIndex });
  }, [focusedQuizIndex, registerEditorContext]);

  useEffect(() => {
    if (!sortedQuiz.length) {
      setFocusedQuizIndex(0);
      return;
    }
    setFocusedQuizIndex((current) => Math.min(current, sortedQuiz.length - 1));
  }, [sortedQuiz.length]);

  useEffect(() => {
    const targetId = scrollToQuestionIdRef.current;
    if (!targetId) return;
    const node = document.querySelector(
      `[data-quiz-question-id="${CSS.escape(targetId)}"]`,
    );
    if (node instanceof HTMLElement) {
      node.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    }
    scrollToQuestionIdRef.current = null;
  }, [sortedQuiz]);

  const applyQuiz = (nextQuiz: AdminModuleQuizItem[]) => {
    dispatch(setQuiz(nextQuiz));
  };

  const updateQuiz = (id: string, patch: Partial<AdminModuleQuizItem>) => {
    if (!working) return;
    const isQuestionContentEdit =
      'question' in patch || 'options' in patch || 'correct_indices' in patch;
    if (isQuestionContentEdit) {
      dispatch(clearExplanationReviewAcknowledgement(id));
    }
    applyQuiz(updateQuizItem(working.quiz, id, patch));
  };

  const handleAddQuestion = () => {
    if (!working) return;
    const next = addQuizItem(working.quiz);
    const added = next[next.length - 1];
    if (added) {
      scrollToQuestionIdRef.current = added.id;
      setFocusedQuizIndex(next.length - 1);
    }
    applyQuiz(next);
  };

  const handleDuplicateQuestion = (id: string) => {
    if (!working) return;
    const next = duplicateQuizItem(working.quiz, id);
    const sorted = sortQuizItems(next);
    const sourceIndex = sorted.findIndex((item) => item.id === id);
    const duplicate = sorted[sourceIndex + 1];
    if (duplicate) {
      scrollToQuestionIdRef.current = duplicate.id;
      setFocusedQuizIndex(sourceIndex + 1);
    }
    applyQuiz(next);
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
  const busyLabel = isSaving ? 'Saving module…' : 'Refreshing module…';

  return (
    <section className="space-y-4">
      <Loader open={busy} label={busyLabel} />
      {actionError ? (
        <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
          {actionError}
        </div>
      ) : null}

      <Card variant="elevated" className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-lg font-semibold text-spice-text-primary">
              {isReadonly ? 'Quiz questions' : 'Build quiz questions'}
            </div>
            <div className="mt-1 text-xs text-spice-text-muted">
              {sortedQuiz.length} questions ·{' '}
              {resolveDisplayText(working.title, 'Module')}
            </div>
          </div>
          {!isReadonly && sortedQuiz.length > 0 ? (
            <Button
              variant="secondary"
              className="inline-flex h-9 items-center gap-1.5 text-xs text-spice-semantic-error ring-1 ring-spice-semantic-error/30"
              disabled={busy}
              onClick={() => applyQuiz(clearAllQuizItems())}
            >
              <DeleteIcon className="h-3.5 w-3.5" />
              Remove all
            </Button>
          ) : null}
        </div>

        <div className="space-y-3">
          {sortedQuiz.length ? (
            <>
              <ReorderableList
                items={sortedQuiz}
                disabled={busy}
                readOnly={isReadonly}
                rowVariant="plain"
                getItemId={(item) => item.id}
                onReorder={(fromIndex, toIndex) =>
                  applyQuiz(reorderQuizItems(sortedQuiz, fromIndex, toIndex))
                }
                renderItem={(m, index, controls) => {
                  const options = isReadonly
                    ? readLocaleOptions(
                        m.options,
                        DEPLOYMENT_PRIMARY_LOCALE,
                        'en',
                      )
                    : (m.options[DEPLOYMENT_PRIMARY_LOCALE] ?? []);
                  const displayOptions = options.length ? options : [''];
                  const correctIndex = clampCorrectIndex(
                    displayOptions.length,
                    m.correct_indices,
                  );
                  return (
                    <div data-quiz-question-id={m.id}>
                      <Card variant="bordered" className="space-y-3 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {!isReadonly ? (
                              <ReorderDragHandle
                                dragHandleProps={controls.dragHandleProps}
                              />
                            ) : null}
                            <div className="text-xs font-semibold tracking-wider text-spice-text-muted">
                              QUESTION {index + 1}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!isReadonly ? (
                              <>
                                <Button
                                  variant="secondary"
                                  className="inline-flex h-8 w-8 items-center justify-center p-0"
                                  disabled={busy}
                                  aria-label={`Duplicate question ${index + 1}`}
                                  title="Duplicate"
                                  onClick={() => handleDuplicateQuestion(m.id)}
                                >
                                  <CopyIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="secondary"
                                  className="inline-flex h-8 w-8 items-center justify-center p-0 text-spice-semantic-error ring-1 ring-spice-semantic-error/30"
                                  disabled={busy}
                                  aria-label={`Remove question ${index + 1}`}
                                  title="Remove"
                                  onClick={() =>
                                    applyQuiz(
                                      removeQuizItem(working.quiz, m.id),
                                    )
                                  }
                                >
                                  <DeleteIcon className="h-4 w-4" />
                                </Button>
                              </>
                            ) : null}
                          </div>
                        </div>

                        <label className="block space-y-1">
                          <span className="text-xs font-semibold text-spice-text-primary">
                            Question
                          </span>
                          <input
                            className="w-full rounded-md border border-spice-border bg-spice-bg-tint px-3 py-2 text-sm text-spice-text-primary outline-none"
                            value={
                              isReadonly
                                ? readLocaleText(
                                    m.question,
                                    DEPLOYMENT_PRIMARY_LOCALE,
                                  )
                                : (m.question[DEPLOYMENT_PRIMARY_LOCALE] ?? '')
                            }
                            disabled={busy || isReadonly}
                            onFocus={() => setFocusedQuizIndex(index)}
                            onChange={(event) =>
                              updateQuiz(m.id, {
                                question: patchLocaleField(
                                  m.question,
                                  DEPLOYMENT_PRIMARY_LOCALE,
                                  event.target.value,
                                ),
                              })
                            }
                            placeholder="Type your question…"
                          />
                        </label>

                        {/*
                  Question (EN) intentionally hidden.
                  */}

                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-spice-text-primary">
                              Answer options
                            </span>
                            {!isReadonly ? (
                              <span className="text-[11px] text-spice-text-muted">
                                Select the correct answer
                              </span>
                            ) : null}
                          </div>
                          {displayOptions.map((option, optionIndex) => {
                            const isCorrect = optionIndex === correctIndex;
                            return (
                              <label
                                key={`${m.id}-${optionIndex}`}
                                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                                  isCorrect
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-spice-border bg-spice-bg-surface'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`correct-${m.id}`}
                                  checked={isCorrect}
                                  disabled={busy || isReadonly}
                                  onChange={() =>
                                    updateQuiz(m.id, {
                                      correct_indices: [optionIndex],
                                    })
                                  }
                                />
                                <input
                                  className="w-full bg-transparent outline-none"
                                  value={option}
                                  disabled={busy || isReadonly}
                                  onFocus={() => setFocusedQuizIndex(index)}
                                  onChange={(event) => {
                                    const next = displayOptions.map((o, i) =>
                                      i === optionIndex
                                        ? event.target.value
                                        : o,
                                    );
                                    updateQuiz(m.id, {
                                      options: setLocaleOptions(
                                        m.options,
                                        DEPLOYMENT_PRIMARY_LOCALE,
                                        next,
                                      ),
                                    });
                                  }}
                                  placeholder={`Option ${optionIndex + 1}`}
                                />
                                {isCorrect ? (
                                  <span className="shrink-0 rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white">
                                    CORRECT ANSWER
                                  </span>
                                ) : null}
                                {!isReadonly ? (
                                  <button
                                    type="button"
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-spice-semantic-error transition-colors hover:bg-spice-semantic-errorBg disabled:cursor-not-allowed disabled:opacity-50"
                                    disabled={
                                      busy || displayOptions.length <= 2
                                    }
                                    aria-label={`Remove option ${optionIndex + 1}`}
                                    title="Remove"
                                    onClick={() => {
                                      const next = displayOptions.filter(
                                        (_, i) => i !== optionIndex,
                                      );
                                      const nextCorrect = clampCorrectIndex(
                                        next.length,
                                        optionIndex === correctIndex
                                          ? [0]
                                          : [correctIndex],
                                      );
                                      updateQuiz(m.id, {
                                        options: setLocaleOptions(
                                          m.options,
                                          DEPLOYMENT_PRIMARY_LOCALE,
                                          next,
                                        ),
                                        correct_indices: [nextCorrect],
                                      });
                                    }}
                                  >
                                    <DeleteIcon className="h-3.5 w-3.5" />
                                  </button>
                                ) : null}
                              </label>
                            );
                          })}
                        </div>

                        {!isReadonly ? (
                          <button
                            type="button"
                            className="flex w-full items-center justify-center rounded-md border border-dashed border-spice-border px-3 py-2.5 text-sm font-medium text-spice-brand-primary transition-colors hover:bg-spice-bg-tint disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={busy}
                            onClick={() => {
                              const next = [...displayOptions, ''];
                              updateQuiz(m.id, {
                                options: setLocaleOptions(
                                  m.options,
                                  DEPLOYMENT_PRIMARY_LOCALE,
                                  next,
                                ),
                              });
                            }}
                          >
                            + Add option
                          </button>
                        ) : null}

                        <div className="space-y-2">
                          <div className="text-xs font-semibold tracking-wider text-spice-text-muted">
                            Explanation shown for wrong answers
                          </div>
                          <textarea
                            data-quiz-explanation-id={m.id}
                            className={`min-h-[100px] w-full resize-y rounded-md border bg-spice-bg-tint px-3 py-2 text-sm text-spice-text-primary outline-none ${
                              pendingReviewSet.has(m.id)
                                ? 'border-spice-semantic-error ring-1 ring-spice-semantic-error'
                                : 'border-spice-border'
                            }`}
                            value={
                              isReadonly
                                ? readLocaleText(
                                    m.explanation,
                                    DEPLOYMENT_PRIMARY_LOCALE,
                                  )
                                : (m.explanation?.[DEPLOYMENT_PRIMARY_LOCALE] ??
                                  '')
                            }
                            disabled={busy || isReadonly}
                            onFocus={() => {
                              setFocusedQuizIndex(index);
                              acknowledgeReview(m.id);
                            }}
                            onChange={(event) => {
                              acknowledgeReview(m.id);
                              updateQuiz(m.id, {
                                explanation: patchLocaleField(
                                  m.explanation ?? {},
                                  DEPLOYMENT_PRIMARY_LOCALE,
                                  event.target.value,
                                ),
                              });
                            }}
                            placeholder="Write an explanation…"
                          />
                        </div>

                        {/*
                  Explanation (EN) intentionally hidden.
                  */}
                      </Card>
                    </div>
                  );
                }}
              />
              {!isReadonly ? (
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-1.5 rounded-md border border-spice-border bg-spice-bg-surface px-3 py-2.5 text-sm font-medium text-spice-brand-primary transition-colors hover:bg-spice-bg-tint disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={busy}
                  onClick={handleAddQuestion}
                >
                  <span aria-hidden="true">+</span>
                  Add question
                </button>
              ) : null}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl bg-spice-bg-tint px-6 py-12 text-center ring-1 ring-spice-border">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-spice-bg-surface text-xl font-semibold text-spice-text-muted ring-1 ring-spice-border">
                ?
              </div>
              <div>
                <div className="text-sm font-semibold text-spice-text-primary">
                  No quiz questions yet
                </div>
                <p className="mt-1 text-xs text-spice-text-muted">
                  Add your first question to build this quiz.
                </p>
              </div>
              {!isReadonly ? (
                <Button
                  className="inline-flex h-9 items-center gap-1.5 text-xs"
                  disabled={busy}
                  onClick={handleAddQuestion}
                >
                  <span aria-hidden="true">+</span>
                  Add question
                </Button>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          {!isReadonly ? (
            <Button
              variant="secondary"
              className="inline-flex h-9 items-center gap-1.5 text-xs"
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
              <SaveDraftIcon className="h-3.5 w-3.5" />
              {isSaving ? 'Saving…' : 'Save draft'}
            </Button>
          ) : null}
          <Button
            className="inline-flex h-9 items-center gap-1.5 text-xs"
            disabled={busy}
            onClick={() =>
              validateBeforeProceed(async () => {
                setActionError('');
                try {
                  const moduleIdForNav = isDirty
                    ? (await save()).id
                    : working.id;
                  navigate(
                    paths.adminModuleReviewPublish.replace(
                      ':moduleId',
                      encodeURIComponent(moduleIdForNav),
                    ),
                  );
                } catch (err) {
                  setActionError(formatError(err));
                }
              })
            }
          >
            Continue to Review
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Button>
        </div>
      </Card>
    </section>
  );
};
