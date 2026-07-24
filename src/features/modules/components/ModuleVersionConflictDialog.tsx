import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';

export interface ModuleVersionConflictDialogProps {
  open: boolean;
  currentVersion?: number;
  onDismiss: () => void;
  onReload: () => void;
  isReloading?: boolean;
}

export const ModuleVersionConflictDialog = ({
  open,
  currentVersion,
  onDismiss,
  onReload,
  isReloading = false,
}: ModuleVersionConflictDialogProps) => {
  if (!open) return null;

  const description =
    currentVersion != null
      ? `This module was updated elsewhere (now at version ${currentVersion}). Reload to see the latest version. Your unsaved edits will be discarded.`
      : 'This module was updated elsewhere. Reload to see the latest version. Your unsaved edits will be discarded.';

  return (
    <Modal
      open={open}
      labelledBy="module-version-conflict-title"
      describedBy="module-version-conflict-description"
      onClose={isReloading ? undefined : onDismiss}
      zIndexClassName="z-[320]"
    >
      <Card
        variant="elevated"
        className="w-full max-w-md space-y-4 border-spice-border p-6 shadow-lg"
      >
        <div className="space-y-2">
          <h2
            id="module-version-conflict-title"
            className="text-lg font-semibold text-spice-text-primary"
          >
            Module has been modified
          </h2>
          <p
            id="module-version-conflict-description"
            className="text-sm text-spice-text-muted"
          >
            {description}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            onClick={onDismiss}
            disabled={isReloading}
          >
            Stay
          </Button>
          <Button onClick={onReload} disabled={isReloading}>
            {isReloading ? 'Reloading…' : 'Reload'}
          </Button>
        </div>
      </Card>
    </Modal>
  );
};
