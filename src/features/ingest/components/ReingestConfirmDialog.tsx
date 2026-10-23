import { Banner, ConfirmDialog } from '@/components/ui';

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
  return (
    <ConfirmDialog
      open={open}
      labelledBy="reingest-video-title"
      describedBy="reingest-video-description"
      contentClassName="max-w-lg"
      showCloseButton={false}
      title="Confirm video re-ingestion"
      description="The following selected videos have already been ingested:"
      confirmLabel="Continue"
      confirmingLabel="Re-ingesting…"
      isConfirming={isConfirming}
      destructive={false}
      onClose={onCancel}
      onConfirm={onConfirm}
    >
      <ul className="list-disc space-y-1 pl-5 text-sm text-spice-text-primary">
        {videoNames.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
      <Banner tone="critical">{REINGEST_VIDEO_WARNING}</Banner>
      <p className="text-sm font-medium text-spice-text-primary">
        Do you want to continue?
      </p>
    </ConfirmDialog>
  );
};
