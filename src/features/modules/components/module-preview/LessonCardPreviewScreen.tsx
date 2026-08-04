import type { PreviewCard } from '@/features/modules/types/modulePreview.types';
import { LearnerRichCardBody } from '@/features/modules/components/module-preview/LearnerRichCardBody';

export interface LessonCardPreviewScreenProps {
  card: PreviewCard;
}

export const LessonCardPreviewScreen = ({
  card,
}: LessonCardPreviewScreenProps) => {
  return (
    <div data-testid="lesson-card-preview-screen">
      <h2 className="mb-4 text-lg font-bold text-spice-text-primary">
        {card.title}
      </h2>
      <LearnerRichCardBody blocks={card.body} />
    </div>
  );
};
