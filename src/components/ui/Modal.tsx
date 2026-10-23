import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from '@/assets/icon';
import { OVERLAY_Z_INDEX } from '@/components/ui/overlayZIndex';
import { cn } from '@/utils';

export interface ModalProps {
  open: boolean;
  children: ReactNode;
  labelledBy: string;
  describedBy?: string;
  /** Optional close handler for escape/backdrop click and the X button. */
  onClose?: () => void;
  /**
   * Show top-right X when `onClose` is provided.
   * Defaults to true whenever `onClose` is set.
   */
  showCloseButton?: boolean;
  /** Increase z-index when stacking modals (e.g. unsaved changes dialog). */
  zIndexClassName?: string;
  /**
   * Max-width / sizing for the centered content shell (e.g. `max-w-4xl`).
   * Prefer this over putting max-width only on the inner Card so the X
   * stays aligned to the card’s top-right.
   */
  contentClassName?: string;
}

export const Modal = ({
  open,
  children,
  labelledBy,
  describedBy,
  onClose,
  showCloseButton,
  zIndexClassName = OVERLAY_Z_INDEX.modal,
  contentClassName,
}: ModalProps) => {
  const shouldShowClose =
    Boolean(onClose) && (showCloseButton === undefined || showCloseButton);

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
          <div
            className={cn(
              // Center a width-constrained shell so Cards with max-w-* are not
              // left-aligned, and the close control stays on the card corner.
              'relative w-full',
              contentClassName,
            )}
          >
            {shouldShowClose ? (
              <button
                type="button"
                onClick={onClose}
                className="absolute right-2 top-2 z-20 inline-flex h-8 w-8 items-center justify-center rounded-lg text-spice-text-muted transition-colors hover:bg-spice-bg-tint hover:text-spice-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-spice-brand-primary/40"
                aria-label="Close"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            ) : null}
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
