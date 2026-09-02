import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { ModalActionBar } from '@/components/ui/ModalActionBar';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  /** Optional extra body content (warnings, banners, etc.). */
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  /** Disables both actions (e.g. while submitting). */
  disabled?: boolean;
  /** Disables only the confirm button (Cancel / X still work). */
  confirmDisabled?: boolean;
  /** Shows busy label on the confirm button. */
  isConfirming?: boolean;
  confirmingLabel?: string;
  /** Use destructive (red) styling on the confirm button. Default true. */
  destructive?: boolean;
  /**
   * Show top-right X. Defaults to true.
   * Set false for flows that should only dismiss via Cancel (e.g. ingest).
   */
  showCloseButton?: boolean;
  labelledBy?: string;
  describedBy?: string;
  contentClassName?: string;
}

/**
 * Shared entity-level confirmation dialog (Deactivate / Delete / Discard).
 * Uses Modal X + ModalActionBar (Cancel = secondary, same as Assign).
 */
export const ConfirmDialog = ({
  open,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
  disabled = false,
  confirmDisabled = false,
  isConfirming = false,
  confirmingLabel,
  destructive = true,
  showCloseButton = true,
  labelledBy = 'confirm-dialog-title',
  describedBy = 'confirm-dialog-description',
  contentClassName = 'max-w-md',
}: ConfirmDialogProps) => {
  const busy = disabled || isConfirming;

  return (
    <Modal
      open={open}
      labelledBy={labelledBy}
      describedBy={describedBy}
      contentClassName={contentClassName}
      showCloseButton={showCloseButton}
      onClose={() => {
        if (busy) return;
        onClose();
      }}
    >
      <Card
        variant="elevated"
        className="w-full border-spice-border p-0 shadow-lg"
      >
        <div className="space-y-3 p-6 pb-4 pr-12">
          <h2
            id={labelledBy}
            className="text-lg font-semibold text-spice-text-primary"
          >
            {title}
          </h2>
          <div id={describedBy} className="text-sm text-spice-text-medium">
            {description}
          </div>
          {children}
        </div>

        <ModalActionBar
          cancelLabel={cancelLabel}
          confirmLabel={confirmLabel}
          confirmingLabel={confirmingLabel}
          isConfirming={isConfirming}
          cancelDisabled={busy}
          confirmDisabled={confirmDisabled}
          destructive={destructive}
          onCancel={onClose}
          onConfirm={onConfirm}
        />
      </Card>
    </Modal>
  );
};
