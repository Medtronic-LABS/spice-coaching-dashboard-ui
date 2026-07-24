import { Button, Card } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';

export interface QuizExplanationReviewDialogProps {
  open: boolean;
  onReviewExplanations: () => void;
}

export const QuizExplanationReviewDialog = ({
  open,
  onReviewExplanations,
}: QuizExplanationReviewDialogProps) => {
  if (!open) return null;

  return (
    <Modal
      open={open}
      labelledBy="quiz-explanation-review-title"
      describedBy="quiz-explanation-review-description"
      zIndexClassName="z-[310]"
    >
      <Card
        variant="elevated"
        className="w-full max-w-md space-y-4 border-spice-border p-4 shadow-lg sm:p-6"
      >
        <div className="space-y-2">
          <h2
            id="quiz-explanation-review-title"
            className="text-lg font-semibold text-spice-text-primary"
          >
            Review explanations
          </h2>
          <p
            id="quiz-explanation-review-description"
            className="text-sm text-spice-text-muted"
          >
            Some quiz questions or answer options have been modified. Please
            review and verify the highlighted explanation(s) before proceeding
            to Review &amp; Publish.
          </p>
        </div>
        <div className="flex justify-end">
          <Button onClick={onReviewExplanations}>Review Explanations</Button>
        </div>
      </Card>
    </Modal>
  );
};
