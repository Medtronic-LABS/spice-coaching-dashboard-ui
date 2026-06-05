import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Loader } from '@/components/ui';
import { paths } from '@/constants/routes';
import type { AdminModuleQuizItem } from '@/features/module-library/api/adminModulesApi';
import {
  ReorderableList,
  ReorderDragHandle,
} from '@/features/module-library/components/ReorderableList';
import { useAdminModuleReviewEditor } from '@/features/module-library/hooks/useAdminModuleReviewEditor';
import { useAdminModuleReviewReadonly } from '@/features/module-library/hooks/useAdminModuleReviewReadonly';
import { setQuiz } from '@/features/module-library/store/adminModuleReviewSlice';
import {
  addQuizItem,
  clampCorrectIndex,
  clearAllQuizItems,
  removeQuizItem,
  reorderQuizItems,
  sortQuizItems,
  updateQuizItem,
} from '@/features/module-library/utils/adminModuleQuizUtils';
import { useAppDispatch } from '@/store/hooks';

function safeText(value: string | null | undefined): string {
  return typeof value === 'string' ? value : '';
}

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
  } = useAdminModuleReviewEditor(moduleId);

  const [actionError, setActionError] = useState('');
  const isReadonly = useAdminModuleReviewReadonly();

  const sortedQuiz = useMemo(
    () => (working ? sortQuizItems(working.quiz) : []),
    [working],
  );

  const applyQuiz = (nextQuiz: AdminModuleQuizItem[]) => {
    dispatch(setQuiz(nextQuiz));
  };

  const updateQuiz = (id: string, patch: Partial<AdminModuleQuizItem>) => {
    if (!working) return;
    applyQuiz(updateQuizItem(working.quiz, id, patch));
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

  return (
    <section className="space-y-4">
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
              {working.title_en ?? working.title_bn ?? 'Module'}
            </div>
          </div>
          {!isReadonly ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                className="h-9 text-xs text-spice-semantic-error ring-1 ring-spice-semantic-error/30"
                disabled={busy || sortedQuiz.length === 0}
                onClick={() => applyQuiz(clearAllQuizItems())}
              >
                Remove all
              </Button>
              <Button
                variant="secondary"
                className="h-9 text-xs"
                disabled={busy}
                onClick={() => applyQuiz(addQuizItem(working.quiz))}
              >
                Add Question
              </Button>
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          {sortedQuiz.length ? (
            <ReorderableList
              items={sortedQuiz}
              disabled={busy}
              rowVariant="plain"
              getItemId={(item) => item.id}
              onReorder={(fromIndex, toIndex) =>
                applyQuiz(reorderQuizItems(sortedQuiz, fromIndex, toIndex))
              }
              renderItem={(m, index, controls) => {
                const options = m.options_bn ?? [''];
                const correctIndex = clampCorrectIndex(
                  options.length,
                  m.correct_indices,
                );
                return (
                  <Card variant="bordered" className="space-y-3 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <ReorderDragHandle
                          dragHandleProps={controls.dragHandleProps}
                        />
                        <div className="text-xs font-semibold tracking-wider text-spice-text-muted">
                          QUESTION {index + 1}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-spice-text-muted">
                          {String(m.difficulty ?? '')}
                        </div>
                        {!isReadonly ? (
                          <Button
                            variant="secondary"
                            className="h-8 px-2 text-xs text-spice-semantic-error ring-1 ring-spice-semantic-error/30"
                            disabled={busy}
                            onClick={() =>
                              applyQuiz(removeQuizItem(working.quiz, m.id))
                            }
                          >
                            Remove
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    <input
                      className="w-full rounded-md border border-spice-border bg-spice-bg-tint px-3 py-2 text-sm text-spice-text-primary outline-none"
                      value={safeText(m.question_bn)}
                      disabled={busy || isReadonly}
                      onChange={(event) =>
                        updateQuiz(m.id, { question_bn: event.target.value })
                      }
                      placeholder="Type your question…"
                    />

                    {/*
                  Question (EN) intentionally hidden.
                  */}

                    <div className="space-y-2">
                      {options.map((option, optionIndex) => {
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
                              onChange={(event) => {
                                const next = (m.options_bn ?? []).map((o, i) =>
                                  i === optionIndex ? event.target.value : o,
                                );
                                updateQuiz(m.id, { options_bn: next });
                              }}
                              placeholder={`Option ${optionIndex + 1}`}
                            />
                            {!isReadonly ? (
                              <button
                                type="button"
                                className="text-xs font-semibold text-spice-semantic-error"
                                disabled={busy || options.length <= 2}
                                onClick={() => {
                                  const next = options.filter(
                                    (_, i) => i !== optionIndex,
                                  );
                                  const nextCorrect = clampCorrectIndex(
                                    next.length,
                                    optionIndex === correctIndex
                                      ? [0]
                                      : [correctIndex],
                                  );
                                  updateQuiz(m.id, {
                                    options_bn: next,
                                    correct_indices: [nextCorrect],
                                  });
                                }}
                              >
                                Remove
                              </button>
                            ) : null}
                          </label>
                        );
                      })}
                    </div>

                    {!isReadonly ? (
                      <div className="flex justify-end">
                        <Button
                          variant="secondary"
                          className="h-8 text-xs"
                          disabled={busy}
                          onClick={() => {
                            const base = m.options_bn ?? [];
                            const next = [...base, ''];
                            updateQuiz(m.id, { options_bn: next });
                          }}
                        >
                          Add Option
                        </Button>
                      </div>
                    ) : null}

                    <div className="space-y-2">
                      <div className="text-xs font-semibold tracking-wider text-spice-text-muted">
                        EXPLANATION FOR WRONG ANSWERS
                      </div>
                      <textarea
                        className="min-h-[100px] w-full resize-y rounded-md border border-spice-border bg-spice-bg-tint px-3 py-2 text-sm text-spice-text-primary outline-none"
                        value={safeText(m.explanation_bn)}
                        disabled={busy || isReadonly}
                        onChange={(event) =>
                          updateQuiz(m.id, {
                            explanation_bn: event.target.value,
                          })
                        }
                        placeholder="Add explanation…"
                      />
                    </div>

                    {/*
                  Explanation (EN) intentionally hidden.
                  */}
                  </Card>
                );
              }}
            />
          ) : (
            <div className="text-xs text-spice-text-muted">No quiz items.</div>
          )}
        </div>

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
                paths.adminModuleReviewPublish.replace(
                  ':moduleId',
                  encodeURIComponent(working.id),
                ),
              )
            }
          >
            Continue to Review
          </Button>
        </div>
      </Card>
    </section>
  );
};
