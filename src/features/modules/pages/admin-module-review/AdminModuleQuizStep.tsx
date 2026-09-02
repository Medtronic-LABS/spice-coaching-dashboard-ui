import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRightIcon,
  CopyIcon,
  DeleteIcon,
  SaveDraftIcon,
} from '@/assets/icon';
import {
  Button,
  Card,
  EmptyState,
  LimitedTextarea,
  LimitedTextInput,
  Loader,
  TruncatedText,
} from '@/components/ui';
import { FIELD_LIMITS } from '@/constants/fieldLimits';
import { paths } from '@/constants/routes';
import type { AdminModuleQuizItem } from '@/features/modules/api/adminModulesApi';
import { AdminModuleDraftValidationDialog } from '@/features/modules/components/AdminModuleDraftValidationDialog';
import {
  ReorderableList,
  ReorderDragHandle,
} from '@/features/modules/components/ReorderableList';
import { useAdminModuleDraftSaveFeedback } from '@/features/modules/hooks/useAdminModuleDraftSaveFeedback';
import { useAdminModuleReviewEditor } from '@/features/modules/hooks/useAdminModuleReviewEditor';
import { useAdminModuleReviewReadonly } from '@/features/modules/hooks/useAdminModuleReviewReadonly';
import { useModulePreview } from '@/features/modules/hooks/useModulePreview';
import { useQuizExplanationReview } from '@/features/modules/hooks/useQuizExplanationReview';
import {
  setQuiz,
  clearExplanationReviewAcknowledgement,
} from '@/features/modules/store/adminModuleReviewSlice';
import {
  navigateToAdminModuleDraftIssue,
  type AdminModuleDraftFocusLocationState,
} from '@/features/modules/utils/adminModuleDraftIssueNavigation';
import { focusAdminModuleDraftIssue } from '@/features/modules/utils/focusAdminModuleDraftIssue';
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
import type { AdminModuleDraftIssue } from '@/features/modules/utils/validateAdminModuleDraftContent';
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
import { cn } from '@/utils';

// Quiz editing is BN-only for now. EN UI is intentionally hidden.

export const AdminModuleQuizStep = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { moduleId = '' } = useParams<{ moduleId: string }>();
  const {
    working,
    isLoading,
    error,
    refetch,
    isSaving,
    save,
    formatError,
    isDirty,
  } = useAdminModuleReviewEditor(moduleId);

  const [focusedQuizIndex, setFocusedQuizIndex] = useState(0);
  const scrollToQuestionIdRef = useRef<string | null>(null);
  const pendingFocusIssueRef = useRef<AdminModuleDraftIssue | null>(null);
  const isReadonly = useAdminModuleReviewReadonly();
  const { registerEditorContext } = useModulePreview();
  const { pendingIds, validateBeforeProceed, acknowledgeReview } =
    useQuizExplanationReview(moduleId);
  const pendingReviewSet = useMemo(() => new Set(pendingIds), [pendingIds]);
  const {
    draftIssues,
    draftValidationOpen,
    clearSaveFeedback,
    captureSaveError,
    closeDraftValidation,
  } = useAdminModuleDraftSaveFeedback(formatError);

  const sortedQuiz = useMemo(
    () => (working ? sortQuizItems(working.quiz) : []),
    [working],
  );

  const reviewDraftIssue = useCallback(
    (issue: AdminModuleDraftIssue) => {
      if (issue.kind !== 'quiz') {
        navigateToAdminModuleDraftIssue({
          navigate,
          moduleId,
          issue,
          onBeforeNavigate: closeDraftValidation,
        });
        return;
      }
      closeDraftValidation();
      const byId = sortedQuiz.findIndex((item) => item.id === issue.itemId);
      setFocusedQuizIndex(byId >= 0 ? byId : issue.index);
      scrollToQuestionIdRef.current = issue.itemId;
      pendingFocusIssueRef.current = issue;
      window.setTimeout(() => {
        focusAdminModuleDraftIssue(issue);
        pendingFocusIssueRef.current = null;
      }, 80);
    },
    [closeDraftValidation, moduleId, navigate, sortedQuiz],
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
    const pending = pendingFocusIssueRef.current;
    if (pending) {
      window.setTimeout(() => focusAdminModuleDraftIssue(pending), 50);
      pendingFocusIssueRef.current = null;
    }
    scrollToQuestionIdRef.current = null;
  }, [sortedQuiz]);

  useEffect(() => {
    const state = location.state as AdminModuleDraftFocusLocationState | null;
    const issue = state?.focusDraftIssue;
    if (!issue || issue.kind !== 'quiz') return;
    const byId = sortedQuiz.findIndex((item) => item.id === issue.itemId);
    setFocusedQuizIndex(byId >= 0 ? byId : issue.index);
    scrollToQuestionIdRef.current = issue.itemId;
    pendingFocusIssueRef.current = issue;
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate, sortedQuiz]);

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

  const busy = isSaving;
  const busyLabel = 'Saving module…';

  return (
    <section className="space-y-4">
      <Loader open={busy} label={busyLabel} />
      <AdminModuleDraftValidationDialog
        open={draftValidationOpen}
        issues={draftIssues}
        onClose={closeDraftValidation}
        onReviewIssue={reviewDraftIssue}
      />

      <Card variant="elevated" className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-lg font-semibold text-spice-text-primary">
              {isReadonly ? 'Quiz questions' : 'Build quiz questions'}
            </div>
            <div className="mt-1 min-w-0 text-xs text-spice-text-muted">
              <div className="flex min-w-0 items-center gap-1">
                <span className="shrink-0">
                  {sortedQuiz.length} questions ·
                </span>
                <TruncatedText
                  text={resolveDisplayText(working.title, 'Module')}
                  className="text-xs text-spice-text-muted"
                />
              </div>
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
                          <LimitedTextInput
                            id={`quiz-question-${m.id}`}
                            data-quiz-field="question"
                            value={
                              isReadonly
                                ? readLocaleText(
                                    m.question,
                                    DEPLOYMENT_PRIMARY_LOCALE,
                                  )
                                : (m.question[DEPLOYMENT_PRIMARY_LOCALE] ?? '')
                            }
                            maxLength={FIELD_LIMITS.quizQuestion}
                            disabled={busy || isReadonly}
                            onFocus={() => setFocusedQuizIndex(index)}
                            onChange={(value) =>
                              updateQuiz(m.id, {
                                question: patchLocaleField(
                                  m.question,
                                  DEPLOYMENT_PRIMARY_LOCALE,
                                  value,
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
                                  className="shrink-0"
                                  checked={isCorrect}
                                  disabled={busy || isReadonly}
                                  onChange={() =>
                                    updateQuiz(m.id, {
                                      correct_indices: [optionIndex],
                                    })
                                  }
                                />
                                <LimitedTextInput
                                  id={`quiz-option-${m.id}-${optionIndex}`}
                                  data-quiz-field="options"
                                  className="min-w-0 flex-1"
                                  inputClassName="h-8 border-0 bg-transparent px-0"
                                  counterPlacement="inline"
                                  value={option}
                                  maxLength={FIELD_LIMITS.quizOption}
                                  disabled={busy || isReadonly}
                                  onFocus={() => setFocusedQuizIndex(index)}
                                  onChange={(value) => {
                                    const next = displayOptions.map((o, i) =>
                                      i === optionIndex ? value : o,
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
                                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-spice-semantic-error transition-colors hover:bg-spice-semantic-errorBg disabled:cursor-not-allowed disabled:opacity-50"
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
                          <LimitedTextarea
                            id={`quiz-explanation-${m.id}`}
                            data-quiz-explanation-id={m.id}
                            textareaClassName={cn(
                              'min-h-[100px]',
                              pendingReviewSet.has(m.id) &&
                                'border-spice-semantic-error ring-1 ring-spice-semantic-error',
                            )}
                            value={
                              isReadonly
                                ? readLocaleText(
                                    m.explanation,
                                    DEPLOYMENT_PRIMARY_LOCALE,
                                  )
                                : (m.explanation?.[DEPLOYMENT_PRIMARY_LOCALE] ??
                                  '')
                            }
                            maxLength={FIELD_LIMITS.description}
                            disabled={busy || isReadonly}
                            onFocus={() => {
                              setFocusedQuizIndex(index);
                              acknowledgeReview(m.id);
                            }}
                            onChange={(value) => {
                              acknowledgeReview(m.id);
                              updateQuiz(m.id, {
                                explanation: patchLocaleField(
                                  m.explanation ?? {},
                                  DEPLOYMENT_PRIMARY_LOCALE,
                                  value,
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
            <EmptyState
              title="No quiz questions yet"
              description="Add your first question to build this quiz."
              action={
                !isReadonly ? (
                  <Button
                    className="inline-flex h-9 items-center gap-1.5 text-xs"
                    disabled={busy}
                    onClick={handleAddQuestion}
                  >
                    <span aria-hidden="true">+</span>
                    Add question
                  </Button>
                ) : undefined
              }
            />
          )}
        </div>

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
              validateBeforeProceed(async () => {
                clearSaveFeedback();
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
                  captureSaveError(err);
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
