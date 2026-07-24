import {
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cn } from '@/utils';

/**
 * Combobox
 * Searchable dropdown for large option sets where options are filtered
 * externally (e.g. server-side search). The parent owns both the selected
 * value and the search term; this component only renders the options it is
 * given, without any client-side filtering.
 *
 * Usage:
 * <Combobox
 *   value={selectedId}
 *   selectedLabel={selectedLabel}
 *   options={searchResults}
 *   searchTerm={term}
 *   onSearchTermChange={setTerm}
 *   onChange={setSelectedId}
 * />
 */
export interface ComboboxOption {
  /** Text shown to users in the dropdown list. */
  label: string;
  /** Underlying value emitted by `onChange`. */
  value: string;
}

export interface ComboboxProps {
  /** Currently selected option value. */
  value: string;
  /** Display label for the selected value (shown while the list is closed). */
  selectedLabel: string;
  /** Options to render; filtering is the parent's responsibility. */
  options: ComboboxOption[];
  /** Controlled search term typed by the user. */
  searchTerm: string;
  /** Called as the user types in the search field. */
  onSearchTermChange: (term: string) => void;
  /** Called with the option value when the user picks an option. */
  onChange: (value: string) => void;
  /** Shows a loading row inside the dropdown while options are fetched. */
  isLoading?: boolean;
  /** Footer hint inside the dropdown, e.g. "Showing 50 of 320". */
  hint?: string;
  /** Message shown when there are no options for the current search. */
  emptyMessage?: string;
  placeholder?: string;
  id?: string;
  className?: string;
  'aria-label'?: string;
}

export const Combobox = ({
  value,
  selectedLabel,
  options,
  searchTerm,
  onSearchTermChange,
  onChange,
  isLoading = false,
  hint,
  emptyMessage = 'No matches found',
  placeholder = 'Type to search…',
  id: idProp,
  className,
  'aria-label': ariaLabel,
}: ComboboxProps) => {
  const generatedId = useId();
  const inputId = idProp ?? generatedId;
  const listboxId = `${inputId}-listbox`;
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [options]);

  const closeList = () => {
    setOpen(false);
    onSearchTermChange('');
  };

  const selectOption = (option: ComboboxOption) => {
    onChange(option.value);
    closeList();
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    closeList();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
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
      setHighlightedIndex((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === 'Enter') {
      if (!open) return;
      event.preventDefault();
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

  let listContent: ReactNode;
  if (isLoading) {
    listContent = (
      <li className="px-3 py-2 text-sm text-spice-text-muted">Loading…</li>
    );
  } else if (options.length === 0) {
    listContent = (
      <li className="px-3 py-2 text-sm text-spice-text-muted">
        {emptyMessage}
      </li>
    );
  } else {
    listContent = options.map((option, index) => (
      <li
        key={option.value || '__empty__'}
        id={`${inputId}-option-${index}`}
        role="option"
        aria-selected={option.value === value}
        className={cn(
          'cursor-pointer px-3 py-2 text-sm text-spice-text-primary',
          index === highlightedIndex && 'bg-spice-bg-tint',
          option.value === value && 'font-semibold',
        )}
        onMouseEnter={() => setHighlightedIndex(index)}
        onMouseDown={(event) => {
          // Select before the input blur closes the list.
          event.preventDefault();
          selectOption(option);
          inputRef.current?.blur();
        }}
      >
        {option.label}
      </li>
    ));
  }

  return (
    <div className={cn('relative', className)} onBlur={handleBlur}>
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && highlightedOption
            ? `${inputId}-option-${highlightedIndex}`
            : undefined
        }
        className="h-10 w-full rounded-md border border-spice-border-mid bg-spice-bg-surface px-3 text-sm text-spice-text-primary outline-none focus:ring-2 focus:ring-spice-brand-primary/25"
        value={open ? searchTerm : selectedLabel}
        placeholder={open ? placeholder : selectedLabel || placeholder}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onChange={(event) => {
          if (!open) setOpen(true);
          onSearchTermChange(event.target.value);
        }}
        onKeyDown={handleKeyDown}
      />
      {open ? (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-spice-border-mid bg-spice-bg-surface shadow-lg">
          <ul
            id={listboxId}
            role="listbox"
            className="max-h-64 overflow-y-auto py-1"
          >
            {listContent}
          </ul>
          {hint ? (
            <p className="border-t border-spice-border-mid px-3 py-1.5 text-xs text-spice-text-muted">
              {hint}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
