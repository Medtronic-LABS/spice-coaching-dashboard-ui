import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils';

export interface ModalActionBarProps {
  /** Secondary / dismiss action. Defaults to `Cancel`. */
  cancelLabel?: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  cancelDisabled?: boolean;
  confirmDisabled?: boolean;
  isConfirming?: boolean;
  confirmingLabel?: string;
  /**
   * Destructive (red) confirm styling — entity delete / deactivate.
   * Default false (primary brand confirm, e.g. Save / Assign).
   */
  destructive?: boolean;
  /** When false, only the confirm button is rendered. Default true. */
  showCancel?: boolean;
  /** Optional content between cancel and confirm (rare). */
  children?: ReactNode;
  className?: string;
}

/**
 * Shared modal footer: Cancel (Assign-style secondary border) + primary confirm.
 * Use for ConfirmDialog and form modals so button order/style stay consistent.
 */
export const ModalActionBar = ({
  cancelLabel = 'Cancel',
  confirmLabel,
  onCancel,
  onConfirm,
  cancelDisabled = false,
  confirmDisabled = false,
  isConfirming = false,
  confirmingLabel,
  destructive = false,
  showCancel = true,
  children,
  className,
}: ModalActionBarProps) => {
  const busy = cancelDisabled || isConfirming;

  return (
    <div
      className={cn(
        'flex shrink-0 flex-col-reverse gap-2 border-t border-spice-border px-6 py-4 sm:flex-row sm:items-center sm:justify-end',
        className,
      )}
    >
      {showCancel ? (
        <Button
          variant="secondary"
          className="h-9 text-xs"
          disabled={busy}
          onClick={onCancel}
        >
          {cancelLabel}
        </Button>
      ) : null}
      {children}
      <Button
        className={
          destructive
            ? 'h-9 bg-spice-semantic-error text-xs hover:bg-spice-semantic-error/90'
            : 'h-9 text-xs'
        }
        disabled={busy || confirmDisabled}
        onClick={onConfirm}
      >
        {isConfirming ? (confirmingLabel ?? confirmLabel) : confirmLabel}
      </Button>
    </div>
  );
};
