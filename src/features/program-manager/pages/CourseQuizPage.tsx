import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/ui';
import { paths } from '@/constants/routes';
import { CourseFlowStepper } from '@/features/program-manager/components/CourseFlowStepper';
import {
  useGetCourseDraftQuery,
  useSaveCourseQuizMutation,
} from '@/features/program-manager/api/programManagerApi';
import type { CourseDraftData } from '@/features/program-manager/types/programManager.types';
import { blocksToPlainText } from '@/features/program-manager/utils/richText';

export const CourseQuizPage = () => {
  const navigate = useNavigate();
  const { data, refetch } = useGetCourseDraftQuery();
  const [saveCourseQuiz, { isLoading }] = useSaveCourseQuizMutation();
  const [quiz, setQuiz] = useState<CourseDraftData['quiz'] | null>(null);
  const isReadOnly = Boolean(data?.isReadOnly);

  useEffect(() => {
    if (data?.quiz) {
      setQuiz(data.quiz);
    }
  }, [data?.quiz]);

  if (data?.generationStatus !== 'generated') {
    return (
      <Card variant="elevated" className="space-y-3">
        <div className="text-lg font-semibold text-spice-text-primary">
          Generate quiz content first
        </div>
        <p className="text-sm text-spice-text-medium">
          Complete document upload and generation before editing quiz questions.
        </p>
        <div>
          <Button onClick={() => navigate(paths.courseCreate)}>
            Go to Module Details
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <section className="space-y-4">
      <CourseFlowStepper currentStep="quiz" isGenerated />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)]">
        <Card variant="elevated" className="space-y-4">
          <h1 className="text-2xl font-semibold text-spice-text-primary">
            Build Quiz Questions
          </h1>
          {(quiz?.questions ?? []).map((question, index) => (
            <div
              key={question.id}
              className="rounded-xl border border-spice-border p-4"
            >
              <div className="mb-2 text-xs font-semibold tracking-wider text-spice-text-muted">
                QUESTION {index + 1} • {question.questionType}
              </div>
              <input
                className="w-full rounded-md border border-spice-border bg-spice-bg-tint px-3 py-2 text-sm text-spice-text-primary outline-none"
                value={blocksToPlainText(question.question)}
                disabled={isReadOnly}
                onChange={(event) => {
                  if (!quiz) return;
                  setQuiz({
                    ...quiz,
                    questions: quiz.questions.map((item) =>
                      item.id === question.id
                        ? {
                            ...item,
                            question: [
                              {
                                type: 'paragraph',
                                content: [
                                  { type: 'text', text: event.target.value },
                                ],
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
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${optionIndex === question.answerIndex ? 'border-green-500 bg-green-50' : 'border-spice-border bg-spice-bg-surface'}`}
                  >
                    <input
                      type="radio"
                      name={String(question.id)}
                      checked={optionIndex === question.answerIndex}
                      disabled={isReadOnly}
                      onChange={() => {
                        if (!quiz) return;
                        setQuiz({
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
                    <input
                      className="w-full bg-transparent outline-none"
                      value={blocksToPlainText(option.text)}
                      disabled={isReadOnly}
                      onChange={(event) => {
                        if (!quiz) return;
                        setQuiz({
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
                                                    text: event.target.value,
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
                <div className="text-xs font-semibold tracking-wider text-spice-text-muted">
                  EXPLANATION
                </div>
                <textarea
                  className="min-h-[100px] w-full resize-y rounded-md border border-spice-border bg-spice-bg-tint px-3 py-2 text-sm text-spice-text-primary outline-none"
                  value={blocksToPlainText(question.explanation)}
                  disabled={isReadOnly}
                  onChange={(event) => {
                    if (!quiz) return;
                    setQuiz({
                      ...quiz,
                      questions: quiz.questions.map((item) =>
                        item.id === question.id
                          ? {
                              ...item,
                              explanation: [
                                {
                                  type: 'paragraph',
                                  content: [
                                    { type: 'text', text: event.target.value },
                                  ],
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
            {!isReadOnly && (
              <Button
                variant="secondary"
                disabled={isLoading || !quiz || isReadOnly}
                onClick={async () => {
                  if (!quiz) return;
                  await saveCourseQuiz({ quiz });
                  await refetch();
                }}
              >
                {isLoading ? 'Saving...' : 'Save Quiz'}
              </Button>
            )}
            <Button onClick={() => navigate(paths.courseReview)}>
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
                setQuiz({
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
