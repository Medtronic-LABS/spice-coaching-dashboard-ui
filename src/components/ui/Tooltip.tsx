import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils';

const TOOLTIP_GAP_PX = 8;
const TOOLTIP_MAX_WIDTH_PX = 380;
const TOOLTIP_CLOSE_DELAY_MS = 150;

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

const PLACEMENT_FALLBACKS: Record<TooltipPlacement, TooltipPlacement[]> = {
  bottom: ['bottom', 'top', 'right', 'left'],
  top: ['top', 'bottom', 'right', 'left'],
  left: ['left', 'right', 'bottom', 'top'],
  right: ['right', 'left', 'bottom', 'top'],
};

export interface TooltipProps {
  /** Tooltip body — string or rich ReactNode. */
  content: ReactNode;
  /** Accessible name for the trigger when using the default info icon. */
  label: string;
  children?: ReactNode;
  className?: string;
  /**
   * Preferred side relative to the trigger. Defaults to `bottom` (current behavior).
   * Flips among all four sides when the preferred side does not fit.
   */
  placement?: TooltipPlacement;
  /** Element type to render for the trigger. Defaults to 'button'. */
  as?: 'button' | 'span';
}

export function InfoIcon({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border border-spice-text-medium/75 bg-white text-[10px] font-bold leading-none text-black',
        className,
      )}
      aria-hidden="true"
    >
      i
    </span>
  );
}

function isNonEmptyString(value: ReactNode): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export const Tooltip = ({
  content,
  label,
  children,
  className,
  placement = 'bottom',
  as = 'button',
}: TooltipProps) => {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const triggerHoveredRef = useRef(false);
  const contentHoveredRef = useRef(false);
  const focusedRef = useRef(false);
  const closeTimeoutRef = useRef<number | null>(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<CSSProperties>();

  const hasContent = isNonEmptyString(content) || typeof content !== 'string';

  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current != null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const maxWidth = Math.min(
      TOOLTIP_MAX_WIDTH_PX,
      viewportWidth - TOOLTIP_GAP_PX * 2,
    );

    const tooltipEl = contentRef.current;
    const tooltipWidth = Math.min(tooltipEl?.offsetWidth || maxWidth, maxWidth);
    const tooltipHeight = tooltipEl?.offsetHeight ?? 0;

    const space: Record<TooltipPlacement, number> = {
      bottom: viewportHeight - rect.bottom - TOOLTIP_GAP_PX,
      top: rect.top - TOOLTIP_GAP_PX,
      left: rect.left - TOOLTIP_GAP_PX,
      right: viewportWidth - rect.right - TOOLTIP_GAP_PX,
    };

    const fits = (side: TooltipPlacement): boolean => {
      if (!tooltipHeight) return side === placement;
      switch (side) {
        case 'bottom':
        case 'top':
          return space[side] >= tooltipHeight;
        case 'left':
        case 'right':
          return space[side] >= tooltipWidth;
      }
    };

    const chosen =
      PLACEMENT_FALLBACKS[placement].find(fits) ??
      (Object.entries(space) as [TooltipPlacement, number][]).sort(
        (a, b) => b[1] - a[1],
      )[0]?.[0] ??
      placement;

    let top: number;
    let left: number;

    switch (chosen) {
      case 'top':
        top = rect.top - TOOLTIP_GAP_PX - tooltipHeight;
        left = rect.left;
        break;
      case 'left':
        top = rect.top;
        left = rect.left - TOOLTIP_GAP_PX - tooltipWidth;
        break;
      case 'right':
        top = rect.top;
        left = rect.right + TOOLTIP_GAP_PX;
        break;
      case 'bottom':
      default:
        top = rect.bottom + TOOLTIP_GAP_PX;
        left = rect.left;
        break;
    }

    left = clamp(
      left,
      TOOLTIP_GAP_PX,
      Math.max(TOOLTIP_GAP_PX, viewportWidth - tooltipWidth - TOOLTIP_GAP_PX),
    );
    top = clamp(
      top,
      TOOLTIP_GAP_PX,
      Math.max(
        TOOLTIP_GAP_PX,
        viewportHeight - (tooltipHeight || 0) - TOOLTIP_GAP_PX,
      ),
    );

    setPosition({
      position: 'fixed',
      left,
      maxWidth,
      top,
    });
  }, [placement]);

  const show = useCallback(() => {
    if (!hasContent) return;
    clearCloseTimeout();
    updatePosition();
    setVisible(true);
  }, [clearCloseTimeout, hasContent, updatePosition]);

  const hideIfInactive = useCallback(() => {
    clearCloseTimeout();
    closeTimeoutRef.current = window.setTimeout(() => {
      if (
        !triggerHoveredRef.current &&
        !contentHoveredRef.current &&
        !focusedRef.current
      ) {
        setVisible(false);
      }
    }, TOOLTIP_CLOSE_DELAY_MS);
  }, [clearCloseTimeout]);

  useLayoutEffect(() => {
    if (!visible) return;
    updatePosition();
  }, [updatePosition, visible]);

  useEffect(() => {
    if (!visible) return undefined;

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [updatePosition, visible]);

  useEffect(() => () => clearCloseTimeout(), [clearCloseTimeout]);

  const TriggerComponent = as === 'span' ? 'span' : 'button';

  return (
    <>
      <TriggerComponent
        ref={
          triggerRef as unknown as React.Ref<
            HTMLSpanElement & HTMLButtonElement
          >
        }
        type={as === 'span' ? undefined : 'button'}
        role={as === 'span' ? 'button' : undefined}
        tabIndex={as === 'span' ? 0 : undefined}
        className={cn(
          children
            ? 'inline-block min-w-0 max-w-full border-0 bg-transparent p-0 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spice-border'
            : 'inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spice-border',
          className,
        )}
        aria-label={label}
        aria-describedby={visible ? tooltipId : undefined}
        onMouseEnter={() => {
          triggerHoveredRef.current = true;
          show();
        }}
        onMouseLeave={() => {
          triggerHoveredRef.current = false;
          hideIfInactive();
        }}
        onFocus={() => {
          focusedRef.current = true;
          show();
        }}
        onBlur={() => {
          focusedRef.current = false;
          hideIfInactive();
        }}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (visible) {
            clearCloseTimeout();
            setVisible(false);
            triggerHoveredRef.current = false;
            contentHoveredRef.current = false;
            focusedRef.current = false;
          } else {
            show();
          }
        }}
        onKeyDown={(event) => {
          if (as === 'span' && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            event.stopPropagation();
            if (visible) {
              clearCloseTimeout();
              setVisible(false);
              triggerHoveredRef.current = false;
              contentHoveredRef.current = false;
              focusedRef.current = false;
            } else {
              show();
            }
          }
        }}
        onMouseDown={(event) => {
          event.preventDefault();
        }}
      >
        {children ?? <InfoIcon />}
      </TriggerComponent>
      {visible && position && hasContent
        ? createPortal(
            <div
              ref={contentRef}
              id={tooltipId}
              role="tooltip"
              className="fixed z-[500] break-words rounded-lg bg-white shadow-spiceOverlay ring-1 ring-spice-border"
              style={position}
              onMouseEnter={() => {
                contentHoveredRef.current = true;
                clearCloseTimeout();
              }}
              onMouseLeave={() => {
                contentHoveredRef.current = false;
                hideIfInactive();
              }}
            >
              {typeof content === 'string' ? (
                <span className="block whitespace-pre-line px-3 py-2 text-xs font-medium leading-relaxed text-spice-text-primary">
                  {content}
                </span>
              ) : (
                content
              )}
            </div>,
            document.body,
          )
        : null}
    </>
  );
};
