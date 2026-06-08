import type { ReactNode } from 'react';

export interface ModalProps {
  open: boolean;
  children: ReactNode;
  labelledBy: string;
  describedBy?: string;
  /** Optional close handler for escape/backdrop click. */
  onClose?: () => void;
  /** Increase z-index when stacking modals (e.g. unsaved changes dialog). */
  zIndexClassName?: string;
}

export const Modal = ({
  open,
  children,
  labelledBy,
  describedBy,
  onClose,
  zIndexClassName = 'z-[100]',
}: ModalProps) => {
  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 ${zIndexClassName} flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      {...(describedBy ? { 'aria-describedby': describedBy } : {})}
      onMouseDown={(e) => {
        if (!onClose) return;
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (!onClose) return;
        if (e.key === 'Escape') onClose();
      }}
      tabIndex={-1}
    >
      {children}
    </div>
  );
};
