import { useEffect, useState } from 'react';
import type { PreviewQuizItem } from '@/features/modules/types/modulePreview.types';
import { PreviewAnswerCard } from '@/features/modules/components/module-preview/PreviewAnswerCard';
import { resolvePreviewAnswerCardState } from '@/features/modules/utils/previewAnswerCardState';

function LightbulbIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
    </svg>
  );
}

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
        Question {questionIndex + 1}/{totalQuestions}
      </div>

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
          className="mt-4 rounded-[10px] bg-spice-bg-tint px-3 py-3 text-sm text-spice-text-primary"
          data-testid="quiz-explanation"
        >
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-spice-brand-appDark">
            <LightbulbIcon />
            Why this matters
          </div>
          {item.explanation}
        </div>
      ) : null}
    </div>
  );
};
