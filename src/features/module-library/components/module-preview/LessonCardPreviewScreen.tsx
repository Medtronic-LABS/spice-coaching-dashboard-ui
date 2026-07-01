import type { PreviewCard } from '@/features/module-library/types/modulePreview.types';
import { LearnerRichCardBody } from '@/features/module-library/components/module-preview/LearnerRichCardBody';

export interface LessonCardPreviewScreenProps {
  card: PreviewCard;
  cardIndex: number;
  totalCards: number;
}

export const LessonCardPreviewScreen = ({
  card,
  cardIndex,
  totalCards,
}: LessonCardPreviewScreenProps) => {
  return (
    <div data-testid="lesson-card-preview-screen">
      <div className="mb-1 text-xs font-medium text-spice-text-muted">
        Learning {cardIndex + 1} of {totalCards}
      </div>
      <h2 className="mb-4 text-lg font-bold text-spice-text-primary">
        {card.title}
      </h2>
      <LearnerRichCardBody blocks={card.body} />
    </div>
  );
};
