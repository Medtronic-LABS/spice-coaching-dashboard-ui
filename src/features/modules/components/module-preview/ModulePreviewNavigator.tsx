import { useMemo } from 'react';
import type {
  ModulePreviewPosition,
  ModulePreviewSnapshot,
} from '@/features/modules/types/modulePreview.types';
import { Button } from '@/components/ui/Button';
import { LessonCardPreviewScreen } from '@/features/modules/components/module-preview/LessonCardPreviewScreen';
import { MobilePreviewFrame } from '@/features/modules/components/module-preview/MobilePreviewFrame';
import { QuizQuestionPreviewScreen } from '@/features/modules/components/module-preview/QuizQuestionPreviewScreen';
import {
  canGoNext,
  canGoPrevious,
  getStepLabel,
  goNext,
  goPrevious,
} from '@/features/modules/utils/modulePreviewNavigation';

export interface ModulePreviewNavigatorProps {
  snapshot: ModulePreviewSnapshot;
  position: ModulePreviewPosition;
  onPositionChange: (next: ModulePreviewPosition) => void;
}

export const ModulePreviewNavigator = ({
  snapshot,
  position,
  onPositionChange,
}: ModulePreviewNavigatorProps) => {
  const stepLabel = getStepLabel(position, snapshot);
  const previousEnabled = canGoPrevious(position, snapshot);
  const nextEnabled = canGoNext(position, snapshot);

  const nextLabel = useMemo(() => {
    if (
      position.phase === 'card' &&
      position.index === snapshot.cards.length - 1 &&
      snapshot.quiz.length > 0
    ) {
      return 'Start Quiz';
    }
    return 'Next';
  }, [position, snapshot.cards.length, snapshot.quiz.length]);

  const activeScreen = useMemo(() => {
    if (position.phase === 'card') {
      const card = snapshot.cards[position.index];
      if (!card) return null;
      return <LessonCardPreviewScreen card={card} />;
    }

    const item = snapshot.quiz[position.index];
    if (!item) return null;
    return (
      <QuizQuestionPreviewScreen
        item={item}
        questionIndex={position.index}
        totalQuestions={snapshot.quiz.length}
      />
    );
  }, [position, snapshot]);

  const footer = (
    <div className="flex items-center gap-3">
      <Button
        variant="secondary"
        className="min-w-0 flex-1"
        disabled={!previousEnabled}
        onClick={() => onPositionChange(goPrevious(position, snapshot))}
        aria-label="Previous"
      >
        Previous
      </Button>
      <Button
        variant="primary"
        className="min-w-0 flex-1"
        disabled={!nextEnabled}
        onClick={() => onPositionChange(goNext(position, snapshot))}
        aria-label={nextLabel}
      >
        {nextLabel}
      </Button>
    </div>
  );

  return (
    <MobilePreviewFrame headerTitle={stepLabel} footer={footer} fillContainer>
      {activeScreen}
    </MobilePreviewFrame>
  );
};
