import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type TransitionEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils';

const DRAWER_TRANSITION_MS = 280;

export interface DrawerProps {
  open: boolean;
  children: ReactNode;
  labelledBy: string;
  describedBy?: string;
  /** Optional close handler for escape/backdrop click. */
  onClose?: () => void;
  /** Increase z-index when stacking overlays. */
  zIndexClassName?: string;
  /** Extra classes for the slide-in panel. */
  panelClassName?: string;
}

export const Drawer = ({
  open,
  children,
  labelledBy,
  describedBy,
  onClose,
  zIndexClassName = 'z-[300]',
  panelClassName,
}: DrawerProps) => {
  const [mounted, setMounted] = useState(open);
  const [entered, setEntered] = useState(false);
  const closingRef = useRef(false);

  useEffect(() => {
    if (open) {
      closingRef.current = false;
      setMounted(true);
      const frame = window.requestAnimationFrame(() => {
        setEntered(true);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    if (!mounted) return undefined;

    closingRef.current = true;
    setEntered(false);
    const fallback = window.setTimeout(() => {
      if (closingRef.current) {
        setMounted(false);
      }
    }, DRAWER_TRANSITION_MS + 50);
    return () => window.clearTimeout(fallback);
  }, [open, mounted]);

  useEffect(() => {
    if (!mounted) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mounted]);

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

  const handlePanelTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.propertyName !== 'transform') return;
    if (!closingRef.current) return;
    setMounted(false);
  };

  if (!mounted) return null;

  return createPortal(
    <div className={`fixed inset-0 ${zIndexClassName}`}>
      <div
        className={cn(
          'absolute inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity ease-out',
          entered ? 'opacity-100' : 'opacity-0',
        )}
        style={{ transitionDuration: `${DRAWER_TRANSITION_MS}ms` }}
        onMouseDown={() => {
          onClose?.();
        }}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        {...(describedBy ? { 'aria-describedby': describedBy } : {})}
        className={cn(
          'absolute inset-y-0 right-0 flex w-full max-w-lg flex-col',
          'border-l border-spice-border bg-spice-bg-surface shadow-2xl',
          'ring-1 ring-black/5',
          'transform transition-transform ease-out',
          entered ? 'translate-x-0' : 'translate-x-full',
          panelClassName,
        )}
        style={{ transitionDuration: `${DRAWER_TRANSITION_MS}ms` }}
        onMouseDown={(event) => event.stopPropagation()}
        onTransitionEnd={handlePanelTransitionEnd}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
};
