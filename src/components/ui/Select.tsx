import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';
import { ChevronIcon } from '@/assets/icon';
import { SPICE_INPUT_FOCUS_CLASSNAME } from '@/constants/formControls';
import { cn } from '@/utils';

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
}

export const Select = ({
  options,
  value,
  onChange,
  className,
  triggerClassName,
  disabled,
  id: idProp,
  'aria-label': ariaLabel,
  ...props
}: SelectProps) => {
  const generatedId = useId();
  const triggerId = idProp ?? generatedId;
  const listboxId = `${triggerId}-listbox`;
  const [open, setOpen] = useState(false);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const [highlightedIndex, setHighlightedIndex] = useState(selectedIndex);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedOption =
    options.find((option) => option.value === value) ?? options[0];
  const selectedLabel = selectedOption?.label ?? '';

  useEffect(() => {
    if (!open) return;
    setHighlightedIndex(selectedIndex);
  }, [open, selectedIndex]);

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
    closeList();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setHighlightedIndex((index) => Math.min(index + 1, options.length - 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setHighlightedIndex((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
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
          setOpen((current) => !current);
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
      {open && !disabled ? (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-spice-border-mid bg-spice-bg-surface shadow-lg">
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
      ) : null}
    </div>
  );
};
