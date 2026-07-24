import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils';

const TOOLTIP_GAP_PX = 8;
const TOOLTIP_MAX_WIDTH_PX = 320;

export interface TruncatedTextProps {
  text: string;
  children?: ReactNode;
  className?: string;
  focusable?: boolean;
}

export const TruncatedText = ({
  text,
  children,
  className,
  focusable = false,
}: TruncatedTextProps) => {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
  const hoveredRef = useRef(false);
  const focusedRef = useRef(false);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<CSSProperties>();

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const maxWidth = Math.min(
      TOOLTIP_MAX_WIDTH_PX,
      viewportWidth - TOOLTIP_GAP_PX * 2,
    );
    const left = Math.min(
      Math.max(rect.left, TOOLTIP_GAP_PX),
      Math.max(TOOLTIP_GAP_PX, viewportWidth - maxWidth - TOOLTIP_GAP_PX),
    );

    setPosition({
      left,
      maxWidth,
      top: rect.bottom + TOOLTIP_GAP_PX,
    });
  }, []);

  const showIfTruncated = useCallback(() => {
    const content = contentRef.current;
    if (!content || content.scrollWidth <= content.clientWidth) {
      setVisible(false);
      return;
    }
    updatePosition();
    setVisible(true);
  }, [updatePosition]);

  const hideIfInactive = useCallback(() => {
    if (!hoveredRef.current && !focusedRef.current) {
      setVisible(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) return undefined;

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [updatePosition, visible]);

  return (
    <>
      <span
        ref={triggerRef}
        className="relative block min-w-0 max-w-full"
        tabIndex={focusable ? 0 : undefined}
        aria-label={focusable ? text : undefined}
        aria-describedby={visible ? tooltipId : undefined}
        onMouseEnter={() => {
          hoveredRef.current = true;
          showIfTruncated();
        }}
        onMouseLeave={() => {
          hoveredRef.current = false;
          hideIfInactive();
        }}
        onFocusCapture={() => {
          focusedRef.current = true;
          showIfTruncated();
        }}
        onBlurCapture={(event) => {
          if (event.currentTarget.contains(event.relatedTarget)) return;
          focusedRef.current = false;
          hideIfInactive();
        }}
      >
        <span ref={contentRef} className={cn('block truncate', className)}>
          {children ?? text}
        </span>
      </span>
      {visible && position
        ? createPortal(
            <span
              id={tooltipId}
              role="tooltip"
              className="pointer-events-none fixed z-50 whitespace-normal break-words rounded-md bg-spice-brand-navy px-3 py-2 text-xs font-medium text-white shadow-spiceOverlay"
              style={position}
            >
              {text}
            </span>,
            document.body,
          )
        : null}
    </>
  );
};
