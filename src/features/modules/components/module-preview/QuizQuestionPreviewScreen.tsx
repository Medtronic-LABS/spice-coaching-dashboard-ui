import { useEffect, useState } from 'react';
import type { PreviewQuizItem } from '@/features/modules/types/modulePreview.types';
import { PreviewAnswerCard } from '@/features/modules/components/module-preview/PreviewAnswerCard';
import { resolvePreviewAnswerCardState } from '@/features/modules/utils/previewAnswerCardState';

export interface QuizQuestionPreviewScreenProps {
  item: PreviewQuizItem;
  questionIndex: number;
  totalQuestions: number;
}

export const QuizQuestionPreviewScreen = ({
  item,
  questionIndex,
  totalQuestions,
}: QuizQuestionPreviewScreenProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    setSelectedIndex(null);
    setIsRevealed(false);
  }, [item.id]);

  const handleSelect = (optionIndex: number) => {
    if (isRevealed) return;
    setSelectedIndex(optionIndex);
    setIsRevealed(true);
  };

  return (
    <div data-testid="quiz-question-preview-screen">
      <div className="mb-1 text-xs font-medium text-spice-text-muted">
        Question {questionIndex + 1} of {totalQuestions}
      </div>

      {item.caseSetup ? (
        <div
          className="mb-4 rounded-lg border border-spice-brand-primary/20 bg-spice-bg-tint px-3 py-2 text-sm text-spice-text-primary"
          data-testid="quiz-case-setup"
        >
          {item.caseSetup}
        </div>
      ) : null}

      <h2 className="mb-4 text-base font-bold text-spice-text-primary">
        {item.question}
      </h2>

      <div className="space-y-2">
        {item.options.map((option, optionIndex) => (
          <PreviewAnswerCard
            key={`${item.id}-option-${optionIndex}`}
            text={option}
            index={optionIndex}
            state={resolvePreviewAnswerCardState(
              optionIndex,
              selectedIndex,
              item.correctIndex,
              isRevealed,
            )}
            onSelect={() => handleSelect(optionIndex)}
            disabled={isRevealed}
          />
        ))}
      </div>

      {isRevealed && item.explanation ? (
        <div
          className="mt-4 rounded-lg bg-spice-bg-tint px-3 py-3 text-sm text-spice-text-primary"
          data-testid="quiz-explanation"
        >
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-spice-text-muted">
            Explanation
          </div>
          {item.explanation}
        </div>
      ) : null}

      {isRevealed ? (
        <p className="mt-3 text-xs text-spice-text-muted">
          Use Next below to continue.
        </p>
      ) : null}
    </div>
  );
};
