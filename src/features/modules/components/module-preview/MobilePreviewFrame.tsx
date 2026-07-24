import type { ReactNode } from 'react';
import { cn } from '@/utils';

/** Fixed phone mockup height when not filling a parent container. */
export const MOBILE_PREVIEW_FRAME_HEIGHT_PX = 700;

export interface MobilePreviewFrameProps {
  headerTitle: string;
  headerSubtitle?: string;
  onClose?: () => void;
  children: ReactNode;
  footer?: ReactNode;
  /** When true, fills the parent height and scrolls lesson content inside the frame. */
  fillContainer?: boolean;
}

export const MobilePreviewFrame = ({
  headerTitle,
  headerSubtitle,
  onClose,
  children,
  footer,
  fillContainer = false,
}: MobilePreviewFrameProps) => {
  return (
    <div
      role="region"
      aria-label="Module preview"
      className={cn(
        'mx-auto w-full max-w-[390px] overflow-hidden rounded-[2rem] bg-spice-neutral-200 shadow-lg ring-1 ring-black/10',
        fillContainer
          ? 'grid h-0 min-h-0 flex-1 grid-rows-[auto_1fr_auto]'
          : 'grid h-[700px] grid-rows-[auto_1fr_auto]',
      )}
    >
      <header className="bg-spice-brand-app px-4 py-3 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{headerTitle}</div>
            {headerSubtitle ? (
              <div className="mt-0.5 text-xs text-white/85">
                {headerSubtitle}
              </div>
            ) : null}
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-white/90 hover:bg-white/10"
              aria-label="Close preview"
            >
              Close
            </button>
          ) : null}
        </div>
      </header>

      <div className="min-h-0 overflow-y-auto bg-white px-4 py-4">
        {children}
      </div>

      {footer ? (
        <div className="border-t border-spice-border bg-white px-4 py-3">
          {footer}
        </div>
      ) : null}
    </div>
  );
};
