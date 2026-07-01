import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

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
  zIndexClassName = 'z-[300]',
}: ModalProps) => {
  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !onClose) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className={`fixed inset-0 ${zIndexClassName} overflow-y-auto`}>
      <div
        className="flex min-h-full items-center justify-center bg-black/40 p-3 backdrop-blur-[1px] sm:p-4"
        onMouseDown={(event) => {
          if (!onClose) return;
          if (event.target === event.currentTarget) {
            onClose();
          }
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          {...(describedBy ? { 'aria-describedby': describedBy } : {})}
          className="flex w-full max-w-[calc(100vw-1.5rem)] flex-col items-center overflow-y-auto overscroll-contain max-h-[min(90dvh,calc(100vh-1.5rem))] sm:max-h-[min(90dvh,calc(100vh-2rem))] sm:max-w-[calc(100vw-2rem)]"
          onMouseDown={(event) => event.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
};
