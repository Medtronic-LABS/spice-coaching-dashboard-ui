import { Button, Card, Modal } from '@/components/ui';

export const REINGEST_VIDEO_WARNING =
  'Re-ingesting these videos will reset learner module progress and quiz attempts and scores associated with these modules.';

export interface ReingestConfirmDialogProps {
  open: boolean;
  videoNames: string[];
  onCancel: () => void;
  onConfirm: () => void;
  isConfirming?: boolean;
}

export const ReingestConfirmDialog = ({
  open,
  videoNames,
  onCancel,
  onConfirm,
  isConfirming = false,
}: ReingestConfirmDialogProps) => {
  if (!open) return null;

  return (
    <Modal
      open={open}
      labelledBy="reingest-video-title"
      describedBy="reingest-video-description"
      onClose={isConfirming ? undefined : onCancel}
      zIndexClassName="z-[110]"
    >
      <Card
        variant="elevated"
        className="w-full max-w-lg space-y-4 border-spice-border p-6 shadow-lg"
      >
        <div className="space-y-3">
          <h2
            id="reingest-video-title"
            className="text-lg font-semibold text-spice-text-primary"
          >
            Confirm video re-ingestion
          </h2>
          <p
            id="reingest-video-description"
            className="text-sm text-spice-text-muted"
          >
            The following selected videos have already been ingested:
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-spice-text-primary">
            {videoNames.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
          <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-sm text-spice-semantic-error">
            {REINGEST_VIDEO_WARNING}
          </div>
          <p className="text-sm font-medium text-spice-text-primary">
            Do you want to continue?
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isConfirming}
          >
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isConfirming}>
            {isConfirming ? 'Re-ingesting…' : 'Continue'}
          </Button>
        </div>
      </Card>
    </Modal>
  );
};
