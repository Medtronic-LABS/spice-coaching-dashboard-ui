import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { ChevronIcon } from '@/assets/icon';
import { SPICE_INPUT_FOCUS_CLASSNAME } from '@/constants/formControls';
import { cn } from '@/utils';

/** Portaled listbox nodes use this attribute for outside-click guards. */
export const SELECT_LISTBOX_PORTAL_SELECTOR = '[data-select-listbox]';

const LISTBOX_GAP_PX = 4;
const LISTBOX_MIN_HEIGHT_PX = 120;

function computePortaledListboxStyle(trigger: HTMLElement): CSSProperties {
  const rect = trigger.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const spaceBelow = viewportHeight - rect.bottom - LISTBOX_GAP_PX - 8;
  const spaceAbove = rect.top - LISTBOX_GAP_PX - 8;
  const placeBelow =
    spaceBelow >= LISTBOX_MIN_HEIGHT_PX || spaceBelow >= spaceAbove;

  return {
    position: 'fixed',
    left: rect.left,
    width: rect.width,
    top: placeBelow ? rect.bottom + LISTBOX_GAP_PX : undefined,
    bottom: placeBelow ? undefined : viewportHeight - rect.top + LISTBOX_GAP_PX,
    maxHeight: Math.max(
      LISTBOX_MIN_HEIGHT_PX,
      placeBelow ? spaceBelow : spaceAbove,
    ),
    zIndex: 60,
  };
}

/**
 * Select
 * Custom dropdown (not a native `<select>`) so the open options panel can use
 * the same rounded corners as the rest of the UI.
 *
 * `className` applies to the outer wrapper (layout/width). Trigger chrome is
 * fixed; pass `triggerClassName` to override trigger rounding/colors.
 *
 * Usage:
 * <Select options={[...]} value={value} onChange={setValue} />
 */
export interface SelectOption {
  /** Text shown to users in the dropdown list. */
  label: string;
  /** Underlying value emitted by `onChange`. */
  value: string;
}

export interface SelectProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onChange' | 'value' | 'type'
> {
  /** Available options rendered in the dropdown. */
  options: SelectOption[];
  /** Currently selected option value. */
  value: string;
  /** Change callback that receives only the selected value. */
  onChange: (value: string) => void;
  /** Extra classes for the trigger button (e.g. `rounded-lg`). */
  triggerClassName?: string;
  /**
   * Renders the open list on `document.body` so options stay clickable inside
   * popovers and other overflow/stacking contexts.
   */
  portaledListbox?: boolean;
}

export const Select = ({
  options,
  value,
  onChange,
  className,
  triggerClassName,
  portaledListbox = false,
  disabled,
  id: idProp,
  'aria-label': ariaLabel,
  ...props
}: SelectProps) => {
  const generatedId = useId();
  const triggerId = idProp ?? generatedId;
  const listboxId = `${triggerId}-listbox`;
  const [open, setOpen] = useState(false);
  const [portaledListStyle, setPortaledListStyle] = useState<CSSProperties>();
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const [highlightedIndex, setHighlightedIndex] = useState(selectedIndex);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const portaledListRef = useRef<HTMLDivElement>(null);

  const selectedOption =
    options.find((option) => option.value === value) ?? options[0];
  const selectedLabel = selectedOption?.label ?? '';

  useEffect(() => {
    if (!open) return;
    setHighlightedIndex(selectedIndex);
  }, [open, selectedIndex]);

  const updatePortaledListPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    setPortaledListStyle(computePortaledListboxStyle(trigger));
  }, []);

  useLayoutEffect(() => {
    if (!open || !portaledListbox) return undefined;
    updatePortaledListPosition();
    return undefined;
  }, [open, portaledListbox, options.length, updatePortaledListPosition]);

  useEffect(() => {
    if (!open || !portaledListbox) return undefined;

    const onReposition = () => updatePortaledListPosition();
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [open, portaledListbox, updatePortaledListPosition]);

  const openList = () => {
    if (portaledListbox && triggerRef.current) {
      setPortaledListStyle(computePortaledListboxStyle(triggerRef.current));
    }
    setOpen(true);
  };

  const closeList = () => {
    setOpen(false);
  };

  const selectOption = (option: SelectOption) => {
    onChange(option.value);
    closeList();
    triggerRef.current?.focus();
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    if (
      portaledListbox &&
      event.relatedTarget instanceof Node &&
      portaledListRef.current?.contains(event.relatedTarget)
    ) {
      return;
    }
    closeList();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) {
        openList();
        return;
      }
      setHighlightedIndex((index) => Math.min(index + 1, options.length - 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        openList();
        return;
      }
      setHighlightedIndex((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!open) {
        openList();
        return;
      }
      const option = options[highlightedIndex];
      if (option) selectOption(option);
      return;
    }
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      closeList();
    }
  };

  const highlightedOption = options[highlightedIndex];

  const listboxPanel = (
    <div
      ref={portaledListbox ? portaledListRef : undefined}
      data-select-listbox={portaledListbox ? true : undefined}
      style={portaledListbox ? portaledListStyle : undefined}
      className={cn(
        portaledListbox
          ? 'overflow-hidden rounded-lg border border-spice-border-mid bg-spice-bg-surface shadow-lg'
          : 'absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-spice-border-mid bg-spice-bg-surface shadow-lg',
      )}
    >
      <ul
        id={listboxId}
        role="listbox"
        aria-labelledby={triggerId}
        className="max-h-64 overflow-y-auto py-1"
      >
        {options.map((option, index) => (
          <li
            key={option.value || `__empty-${index}`}
            id={`${triggerId}-option-${index}`}
            role="option"
            aria-selected={option.value === value}
            className={cn(
              'cursor-pointer px-3 py-2 text-sm text-spice-text-primary',
              index === highlightedIndex && 'bg-spice-bg-tint',
              option.value === value && 'font-semibold',
            )}
            onMouseEnter={() => setHighlightedIndex(index)}
            onMouseDown={(event) => {
              event.preventDefault();
              selectOption(option);
            }}
          >
            {option.label}
          </li>
        ))}
      </ul>
    </div>
  );

  const renderedListbox =
    open && !disabled
      ? portaledListbox && portaledListStyle
        ? createPortal(listboxPanel, document.body)
        : !portaledListbox
          ? listboxPanel
          : null
      : null;

  return (
    <div className={cn('relative min-w-0', className)} onBlur={handleBlur}>
      <button
        {...props}
        ref={triggerRef}
        id={triggerId}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={
          open && highlightedOption
            ? `${triggerId}-option-${highlightedIndex}`
            : undefined
        }
        className={cn(
          'relative flex h-10 w-full items-center truncate rounded-lg border border-spice-border-mid bg-spice-bg-surface px-3 pr-10 text-left text-[13px] text-spice-text-primary',
          SPICE_INPUT_FOCUS_CLASSNAME,
          disabled && 'cursor-not-allowed opacity-60',
          triggerClassName,
        )}
        onClick={() => {
          if (disabled) return;
          if (open) {
            closeList();
            return;
          }
          openList();
        }}
        onKeyDown={handleKeyDown}
      >
        <span className="min-w-0 flex-1 truncate">{selectedLabel}</span>
        <ChevronIcon
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-spice-text-muted"
          expanded={open}
          aria-hidden
        />
      </button>
      {renderedListbox}
    </div>
  );
};
