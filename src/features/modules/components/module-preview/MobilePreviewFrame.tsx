import type { ReactNode } from 'react';
import { TruncatedText } from '@/components/ui';
import { CloseIcon } from '@/assets/icon';
import { cn } from '@/utils';

/** Fixed phone mockup height when not filling a parent container. */
export const MOBILE_PREVIEW_FRAME_HEIGHT_PX = 700;

export interface MobilePreviewFrameProps {
  headerTitle: string;
  onClose?: () => void;
  children: ReactNode;
  footer?: ReactNode;
  /** When true, fills the parent height and scrolls lesson content inside the frame. */
  fillContainer?: boolean;
}

export const MobilePreviewFrame = ({
  headerTitle,
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
        <div className="relative flex items-center justify-center gap-3">
          <div className={cn('min-w-0 flex-1', onClose && 'pr-12')}>
            <TruncatedText
              text={headerTitle}
              className="text-center text-sm font-semibold"
            />
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="absolute right-0 inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/90 hover:bg-white/10"
              aria-label="Close preview"
            >
              <CloseIcon className="h-5 w-5" />
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
