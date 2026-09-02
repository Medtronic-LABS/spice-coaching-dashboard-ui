import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { ModalActionBar } from '@/components/ui/ModalActionBar';
import { OVERLAY_Z_INDEX } from '@/components/ui/overlayZIndex';

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
      contentClassName="max-w-md"
      onClose={isReloading ? undefined : onDismiss}
      zIndexClassName={OVERLAY_Z_INDEX.modalTop}
    >
      <Card
        variant="elevated"
        className="w-full border-spice-border p-0 shadow-lg"
      >
        <div className="space-y-2 p-6 pb-4 pr-12">
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
        <ModalActionBar
          cancelLabel="Stay"
          confirmLabel="Reload"
          confirmingLabel="Reloading…"
          isConfirming={isReloading}
          onCancel={onDismiss}
          onConfirm={onReload}
        />
      </Card>
    </Modal>
  );
};
