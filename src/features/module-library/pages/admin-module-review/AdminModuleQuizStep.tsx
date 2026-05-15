import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Card, LoadingState } from '@/components/ui';
import { paths } from '@/constants/routes';
import type { AdminModuleQuizItem } from '@/features/module-library/api/adminModulesApi';
import { useEditModuleMutation } from '@/features/module-library/api/adminModulesApi';
import { useAdminModuleDetailQuery } from '@/features/module-library/hooks/useAdminModuleDetailQuery';
import { applyEditModuleAndSyncRoute } from '@/features/module-library/utils/applyEditModuleAndSyncRoute';
import { formatRtkQueryError } from '@/features/program-manager/utils/formatRtkQueryError';

function clampCorrectIndex(
  optionsLength: number,
  indices: number[] | null | undefined,
): number {
  if (optionsLength <= 0) return 0;
  const first = (indices ?? []).find((n) => Number.isFinite(n) && n >= 0);
  const safe = typeof first === 'number' ? first : 0;
  return Math.min(Math.max(0, safe), optionsLength - 1);
}

export const AdminModuleQuizStep = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { moduleId = '' } = useParams<{ moduleId: string }>();
  const { data, isLoading, isFetching, error, refetch } =
    useAdminModuleDetailQuery(moduleId, { skip: !moduleId });
  const [editModule, { isLoading: isSaving }] = useEditModuleMutation();

  const [actionError, setActionError] = useState('');
  const [quizEdits, setQuizEdits] = useState<
    Record<string, AdminModuleQuizItem>
  >({});
  const [addedQuiz, setAddedQuiz] = useState<AdminModuleQuizItem[]>([]);
  const [deletedQuizIds, setDeletedQuizIds] = useState<Set<string>>(new Set());
  const resetKey = data ? `${data.id}:${data.version}` : null;

  const baseQuiz = useMemo(() => {
    return (data?.quiz ?? []).filter((q) => !deletedQuizIds.has(q.id));
  }, [data?.quiz, deletedQuizIds]);

  const mergedQuiz = useMemo(() => {
    const map = new Map<string, AdminModuleQuizItem>();
    for (const q of baseQuiz) map.set(q.id, q);
    for (const q of addedQuiz) map.set(q.id, q);
    for (const [id, q] of Object.entries(quizEdits)) map.set(id, q);
    return map;
  }, [addedQuiz, baseQuiz, quizEdits]);

  const sortedQuiz = useMemo(() => {
    return Array.from(mergedQuiz.values()).sort(
      (a, b) => a.question_order - b.question_order,
    );
  }, [mergedQuiz]);

  const getQuizItem = (id: string) => mergedQuiz.get(id);

  const updateQuiz = (id: string, patch: Partial<AdminModuleQuizItem>) => {
    const base = getQuizItem(id);
    if (!base) return;
    if (addedQuiz.some((q) => q.id === id)) {
      setAddedQuiz((prev) =>
        prev.map((q) => (q.id === id ? { ...q, ...patch } : q)),
      );
      return;
    }
    setQuizEdits((prev) => ({ ...prev, [id]: { ...base, ...patch } }));
  };

  useEffect(() => {
    if (!resetKey) return;
    setQuizEdits({});
    setAddedQuiz([]);
    setDeletedQuizIds(new Set());
  }, [resetKey]);

  if (isLoading && !data) {
    return (
      <Card variant="elevated" className="p-10">
        <LoadingState label="Loading module…" />
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card variant="elevated" className="space-y-3 p-6">
        <p className="text-sm text-spice-semantic-error">
          {error ? formatRtkQueryError(error) : 'Module not found.'}
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
              Build quiz questions
            </div>
            <div className="mt-1 text-xs text-spice-text-muted">
              {sortedQuiz.length} questions ·{' '}
              {data.title_en ?? data.title_bn ?? 'Module'}
            </div>
          </div>
          <Button
            variant="secondary"
            className="h-9 text-xs"
            disabled={busy}
            onClick={() => {
              const nextOrder =
                Math.max(0, ...sortedQuiz.map((q) => q.question_order ?? 0)) +
                1;
              setAddedQuiz((prev) => [
                ...prev,
                {
                  id: '',
                  question_order: nextOrder,
                  question_bn: null,
                  question_en: '',
                  case_setup_bn: null,
                  case_setup_en: null,
                  options_bn: [''],
                  options_en: ['Option 1', 'Option 2'],
                  correct_indices: [0],
                  explanation_bn: null,
                  explanation_en: '',
                  difficulty: 'medium',
                },
              ]);
            }}
          >
            Add Question
          </Button>
        </div>

        <div className="space-y-3">
          {sortedQuiz.length ? (
            sortedQuiz.map((m, index) => {
              const correctIndex = clampCorrectIndex(
                m.options_en.length,
                m.correct_indices,
              );
              return (
                <Card key={m.id} variant="bordered" className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-semibold tracking-wider text-spice-text-muted">
                      QUESTION {index + 1}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-spice-text-muted">
                        {String(m.difficulty ?? '')}
                      </div>
                      <Button
                        variant="secondary"
                        className="h-8 px-2 text-xs text-spice-semantic-error ring-1 ring-spice-semantic-error/30"
                        disabled={busy}
                        onClick={() => {
                          if (addedQuiz.some((q) => q.id === m.id)) {
                            setAddedQuiz((prev) =>
                              prev.filter((q) => q.id !== m.id),
                            );
                            return;
                          }
                          setDeletedQuizIds((prev) => {
                            const next = new Set(prev);
                            next.add(m.id);
                            return next;
                          });
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>

                  <input
                    className="w-full rounded-md border border-spice-border bg-spice-bg-tint px-3 py-2 text-sm text-spice-text-primary outline-none"
                    value={m.question_en ?? ''}
                    disabled={busy}
                    onChange={(event) =>
                      updateQuiz(m.id, { question_en: event.target.value })
                    }
                    placeholder="Type your question…"
                  />

                  <div className="space-y-2">
                    {m.options_en.map((option, optionIndex) => {
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
                            disabled={busy}
                            onChange={() =>
                              updateQuiz(m.id, {
                                correct_indices: [optionIndex],
                              })
                            }
                          />
                          <input
                            className="w-full bg-transparent outline-none"
                            value={option}
                            disabled={busy}
                            onChange={(event) => {
                              const next = m.options_en.map((o, i) =>
                                i === optionIndex ? event.target.value : o,
                              );
                              updateQuiz(m.id, { options_en: next });
                            }}
                            placeholder={`Option ${optionIndex + 1}`}
                          />
                          <button
                            type="button"
                            className="text-xs font-semibold text-spice-semantic-error"
                            disabled={busy || m.options_en.length <= 2}
                            onClick={() => {
                              const next = m.options_en.filter(
                                (_, i) => i !== optionIndex,
                              );
                              const nextCorrect = clampCorrectIndex(
                                next.length,
                                optionIndex === correctIndex
                                  ? [0]
                                  : [correctIndex],
                              );
                              updateQuiz(m.id, {
                                options_en: next,
                                correct_indices: [nextCorrect],
                              });
                            }}
                          >
                            Remove
                          </button>
                        </label>
                      );
                    })}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="secondary"
                      className="h-8 text-xs"
                      disabled={busy}
                      onClick={() => {
                        const next = [
                          ...m.options_en,
                          `Option ${m.options_en.length + 1}`,
                        ];
                        updateQuiz(m.id, { options_en: next });
                      }}
                    >
                      Add Option
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold tracking-wider text-spice-text-muted">
                      EXPLANATION FOR WRONG ANSWERS
                    </div>
                    <textarea
                      className="min-h-[100px] w-full resize-y rounded-md border border-spice-border bg-spice-bg-tint px-3 py-2 text-sm text-spice-text-primary outline-none"
                      value={m.explanation_en ?? ''}
                      disabled={busy}
                      onChange={(event) =>
                        updateQuiz(m.id, { explanation_en: event.target.value })
                      }
                      placeholder="Add explanation…"
                    />
                  </div>
                </Card>
              );
            })
          ) : (
            <div className="text-xs text-spice-text-muted">No quiz items.</div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            className="h-9 text-xs"
            disabled={busy}
            onClick={async () => {
              setActionError('');
              try {
                const nextQuiz = sortedQuiz;
                await applyEditModuleAndSyncRoute({
                  editModule,
                  navigate,
                  pathname,
                  moduleEntityId: data.id,
                  body: {
                    title_en: data.title_en ?? undefined,
                    module_json: { cards: data.cards, quiz: nextQuiz },
                  },
                  refetch,
                });
              } catch (err) {
                setActionError(formatRtkQueryError(err));
              }
            }}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
          <Button
            className="h-9 text-xs"
            disabled={busy}
            onClick={() =>
              navigate(
                paths.adminModuleReviewPublish.replace(
                  ':moduleId',
                  encodeURIComponent(data.id),
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
