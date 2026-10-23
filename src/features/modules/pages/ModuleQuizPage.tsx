import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  FieldGroupLabel,
  LimitedTextarea,
  LimitedTextInput,
  Loader,
  ModalTitle,
  SectionHeader,
  useSnackbar,
} from '@/components/ui';
import { FIELD_LIMITS } from '@/constants/fieldLimits';
import { paths } from '@/constants/routes';
import { ModuleFlowStepper } from '@/features/modules/components/ModuleFlowStepper';
import { useModuleEditor } from '@/features/modules/hooks/useModuleEditor';
import { setModuleQuiz } from '@/features/modules/store/moduleEditSlice';
import type { ModuleDraftData } from '@/features/modules/types/moduleDraft.types';
import { blocksToPlainText } from '@/components/ui/rich-text/utils/richText';
import { useAppDispatch } from '@/store/hooks';

export const ModuleQuizPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { working, isSavingQuiz, saveQuiz, formatError } = useModuleEditor();
  const snackbar = useSnackbar();
  const isReadOnly = Boolean(working?.isReadOnly);
  const quiz = working?.quiz;

  const updateQuiz = (next: ModuleDraftData['quiz']) => {
    dispatch(setModuleQuiz(next));
  };

  if (working?.generationStatus !== 'generated') {
    return (
      <Card variant="elevated" className="space-y-3">
        <ModalTitle as="h2">Generate quiz content first</ModalTitle>
        <p className="text-sm text-spice-text-medium">
          Complete document upload and generation before editing quiz questions.
        </p>
        <div>
          <Button onClick={() => navigate(paths.moduleCreate)}>
            Go to Module Details
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <section className="space-y-4">
      <Loader open={isSavingQuiz} label="Saving quiz…" />
      <ModuleFlowStepper currentStep="quiz" isGenerated />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)]">
        <Card variant="elevated" className="space-y-4">
          <SectionHeader
            title="Build Quiz Questions"
            variant="h2"
            action={
              !isReadOnly ? (
                <Button
                  variant="secondary"
                  className="text-spice-semantic-error ring-1 ring-spice-semantic-error/30"
                  disabled={
                    isSavingQuiz || !quiz || quiz.questions.length === 0
                  }
                  onClick={() => {
                    if (!quiz) return;
                    updateQuiz({ ...quiz, questions: [] });
                  }}
                >
                  Remove all
                </Button>
              ) : undefined
            }
          />
          {(quiz?.questions ?? []).map((question, index) => (
            <div
              key={question.id}
              className="rounded-xl border border-spice-border p-4"
            >
              <FieldGroupLabel className="mb-2">
                QUESTION {index + 1} • {question.questionType}
              </FieldGroupLabel>
              <LimitedTextInput
                value={blocksToPlainText(question.question)}
                maxLength={FIELD_LIMITS.quizQuestion}
                disabled={isReadOnly}
                onChange={(value) => {
                  if (!quiz) return;
                  updateQuiz({
                    ...quiz,
                    questions: quiz.questions.map((item) =>
                      item.id === question.id
                        ? {
                            ...item,
                            question: [
                              {
                                type: 'paragraph',
                                content: [{ type: 'text', text: value }],
                              },
                            ],
                          }
                        : item,
                    ),
                  });
                }}
              />
              <div className="mt-3 space-y-2">
                {question.options.map((option, optionIndex) => (
                  <label
                    key={`${question.id}-${optionIndex}`}
                    className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${optionIndex === question.answerIndex ? 'border-green-500 bg-green-50' : 'border-spice-border bg-spice-bg-surface'}`}
                  >
                    <input
                      type="radio"
                      name={String(question.id)}
                      className="mt-2.5"
                      checked={optionIndex === question.answerIndex}
                      disabled={isReadOnly}
                      onChange={() => {
                        if (!quiz) return;
                        updateQuiz({
                          ...quiz,
                          questions: quiz.questions.map((item) =>
                            item.id === question.id
                              ? {
                                  ...item,
                                  answerIndex: optionIndex,
                                  correctAnswers: [
                                    item.options[optionIndex]?.id ?? '',
                                  ],
                                }
                              : item,
                          ),
                        });
                      }}
                    />
                    <LimitedTextInput
                      className="min-w-0 flex-1"
                      inputClassName="h-8 border-0 bg-transparent px-0"
                      value={blocksToPlainText(option.text)}
                      maxLength={FIELD_LIMITS.quizOption}
                      disabled={isReadOnly}
                      onChange={(value) => {
                        if (!quiz) return;
                        updateQuiz({
                          ...quiz,
                          questions: quiz.questions.map((item) =>
                            item.id === question.id
                              ? {
                                  ...item,
                                  options: item.options.map(
                                    (innerOption, innerIndex) =>
                                      innerIndex === optionIndex
                                        ? {
                                            ...innerOption,
                                            text: [
                                              {
                                                type: 'paragraph',
                                                content: [
                                                  {
                                                    type: 'text',
                                                    text: value,
                                                  },
                                                ],
                                              },
                                            ],
                                          }
                                        : innerOption,
                                  ),
                                }
                              : item,
                          ),
                        });
                      }}
                    />
                  </label>
                ))}
              </div>
              <div className="mt-3 space-y-2">
                <FieldGroupLabel>EXPLANATION</FieldGroupLabel>
                <LimitedTextarea
                  textareaClassName="min-h-[100px]"
                  value={blocksToPlainText(question.explanation)}
                  maxLength={FIELD_LIMITS.description}
                  disabled={isReadOnly}
                  onChange={(value) => {
                    if (!quiz) return;
                    updateQuiz({
                      ...quiz,
                      questions: quiz.questions.map((item) =>
                        item.id === question.id
                          ? {
                              ...item,
                              explanation: [
                                {
                                  type: 'paragraph',
                                  content: [{ type: 'text', text: value }],
                                },
                              ],
                            }
                          : item,
                      ),
                    });
                  }}
                />
              </div>
            </div>
          ))}
          <div className="flex justify-end gap-2">
            {!isReadOnly ? (
              <Button
                variant="secondary"
                disabled={isSavingQuiz || !quiz || isReadOnly}
                onClick={async () => {
                  try {
                    await saveQuiz();
                  } catch (err) {
                    snackbar.showError(formatError(err));
                  }
                }}
              >
                {isSavingQuiz ? 'Saving...' : 'Save Quiz'}
              </Button>
            ) : null}
            <Button onClick={() => navigate(paths.moduleReview)}>
              Continue to Review
            </Button>
          </div>
        </Card>

        {/* <Card variant="elevated" className="space-y-3">
        <div className="text-sm font-semibold text-spice-text-primary">AI Assistant</div>
        {[
          'Which arm should a CHW use when measuring blood pressure?',
          'What does a diastolic reading of 95 mmHg indicate?',
          'A patient has BP of 145/92 on two separate visits. What should a CHW do?',
        ].map((item) => (
          <div key={item} className="rounded-lg border border-spice-border bg-spice-bg-surface p-3">
            <div className="text-xs text-spice-text-medium">{item}</div>
            <button
              type="button"
              className="mt-2 text-xs font-semibold text-spice-brand-primary"
              disabled={isReadOnly}
              onClick={() => {
                if (!quiz) return;
                const nextId =
                  Math.max(0, ...quiz.questions.map((question) => question.id)) + 1;
                updateQuiz({
                  ...quiz,
                  questions: [
                    ...quiz.questions,
                    {
                      id: nextId,
                      type: 'multiple_choice',
                      question: [
                        {
                          type: 'paragraph',
                          content: [{ type: 'text', text: item }],
                        },
                      ],
                      options: [
                        {
                          id: `opt-${nextId}-1`,
                          text: [
                            {
                              type: 'paragraph',
                              content: [{ type: 'text', text: 'Option 1' }],
                            },
                          ],
                        },
                        {
                          id: `opt-${nextId}-2`,
                          text: [
                            {
                              type: 'paragraph',
                              content: [{ type: 'text', text: 'Option 2' }],
                            },
                          ],
                        },
                      ],
                      explanation: [
                        {
                          type: 'paragraph',
                          content: [{ type: 'text', text: 'Add explanation...' }],
                        },
                      ],
                      answerIndex: 0,
                      correctAnswers: [`opt-${nextId}-1`],
                      difficulty: 'moderate',
                      questionType: 'application',
                      multi: false,
                    },
                  ],
                });
              }}
            >
              + Add to Quiz
            </button>
          </div>
        ))}
      </Card> */}
      </div>
    </section>
  );
};
