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
import {
  isDisplayTextTruncated,
  truncateDisplayText,
} from '@/utils/truncateDisplayText';

const TOOLTIP_GAP_PX = 8;
const TOOLTIP_MAX_WIDTH_PX = 320;
/** Ignore sub-pixel rounding so a 1px delta does not force a tooltip. */
const OVERFLOW_TOLERANCE_PX = 1;

function hasHorizontalOverflow(element: HTMLElement): boolean {
  if (element.scrollWidth - element.clientWidth > OVERFLOW_TOLERANCE_PX) {
    return true;
  }
  for (const child of element.children) {
    if (child instanceof HTMLElement && hasHorizontalOverflow(child)) {
      return true;
    }
  }
  return false;
}

function probeElement(root: HTMLElement): HTMLElement {
  const interactive = root.querySelector('a, button');
  return interactive instanceof HTMLElement ? interactive : root;
}

/** True when `value` is wider than `container` using the visible title font. */
function fullTextOverflowsContainer(
  container: HTMLElement,
  probe: HTMLElement,
  value: string,
): boolean {
  const available = container.clientWidth;
  if (available <= 0) return false;

  const styles = window.getComputedStyle(probe);
  const sizer = document.createElement('span');
  sizer.setAttribute('aria-hidden', 'true');
  sizer.style.position = 'absolute';
  sizer.style.left = '-9999px';
  sizer.style.top = '0';
  sizer.style.visibility = 'hidden';
  sizer.style.pointerEvents = 'none';
  sizer.style.whiteSpace = 'nowrap';
  sizer.style.font = styles.font;
  sizer.style.fontFamily = styles.fontFamily;
  sizer.style.fontSize = styles.fontSize;
  sizer.style.fontWeight = styles.fontWeight;
  sizer.style.fontStyle = styles.fontStyle;
  sizer.style.letterSpacing = styles.letterSpacing;
  sizer.textContent = value;
  document.body.appendChild(sizer);
  try {
    const textWidth = sizer.getBoundingClientRect().width;
    return textWidth - available > OVERFLOW_TOLERANCE_PX;
  } finally {
    sizer.remove();
  }
}

export interface TruncatedTextProps {
  text: string;
  children?: ReactNode;
  className?: string;
  /**
   * Keyboard-focus the trigger. Omit when wrapping a link or button so those
   * controls remain the only tab stop.
   */
  focusable?: boolean;
  /** Character cap before an ellipsis; tooltip shows the full `text` when exceeded. */
  maxChars?: number;
}

export const TruncatedText = ({
  text,
  children,
  className,
  focusable = false,
  maxChars,
}: TruncatedTextProps) => {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
  const hoveredRef = useRef(false);
  const focusedRef = useRef(false);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<CSSProperties>();
  const displayText =
    maxChars != null ? truncateDisplayText(text, maxChars) : text;
  const charTruncated =
    maxChars != null && isDisplayTextTruncated(text, maxChars);

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
    if (charTruncated) {
      updatePosition();
      setVisible(true);
      return;
    }
    const content = contentRef.current;
    const trigger = triggerRef.current;
    if (!content || !trigger) {
      setVisible(false);
      return;
    }
    const visuallyTruncated =
      hasHorizontalOverflow(content) ||
      fullTextOverflowsContainer(trigger, probeElement(content), text);
    if (!visuallyTruncated) {
      setVisible(false);
      return;
    }
    updatePosition();
    setVisible(true);
  }, [charTruncated, text, updatePosition]);

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
        <span
          ref={contentRef}
          className={cn(
            'block min-w-0 max-w-full truncate break-all',
            className,
          )}
        >
          {children ?? displayText}
        </span>
      </span>
      {visible && position
        ? createPortal(
            <span
              id={tooltipId}
              role="tooltip"
              className="pointer-events-none fixed z-[500] whitespace-normal break-all rounded-md bg-spice-brand-navy px-3 py-2 text-xs font-medium text-white shadow-spiceOverlay"
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
