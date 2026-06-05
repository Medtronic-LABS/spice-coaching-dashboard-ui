import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';

export interface UnsavedChangesDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  onStay: () => void;
  onDiscard: () => void;
  onSaveAndLeave?: () => void;
  isSaving?: boolean;
}

export const UnsavedChangesDialog = ({
  open,
  title = 'Unsaved changes',
  description = 'You have changes that are not saved yet. Save before leaving, or discard your edits.',
  onStay,
  onDiscard,
  onSaveAndLeave,
  isSaving = false,
}: UnsavedChangesDialogProps) => {
  if (!open) return null;

  return (
    <Modal
      open={open}
      labelledBy="unsaved-changes-title"
      zIndexClassName="z-[110]"
    >
      <Card
        variant="elevated"
        className="w-full max-w-md space-y-4 border-spice-border p-6 shadow-lg"
      >
        <div className="space-y-2">
          <h2
            id="unsaved-changes-title"
            className="text-lg font-semibold text-spice-text-primary"
          >
            {title}
          </h2>
          <p className="text-sm text-spice-text-muted">{description}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onStay} disabled={isSaving}>
            Stay on page
          </Button>
          <Button variant="ghost" onClick={onDiscard} disabled={isSaving}>
            Discard changes
          </Button>
          {onSaveAndLeave ? (
            <Button onClick={onSaveAndLeave} disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save & leave'}
            </Button>
          ) : null}
        </div>
      </Card>
    </Modal>
  );
};
