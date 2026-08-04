import { type InputHTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils';

/**
 * SearchInput
 * Controlled text input optimized for search/filter use cases.
 * Defaults to `aria-label="Search"` only when neither `aria-label`
 * nor `aria-labelledby` is provided.
 *
 * Usage:
 * <SearchInput value={query} onChange={setQuery} placeholder="Search..." />
 */
export interface SearchInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'value'
> {
  /** Controlled input value. */
  value: string;
  /** Change callback that receives only the raw text value. */
  onChange: (value: string) => void;
}

const SearchIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    data-testid="search-input-icon"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const SearchInput = ({
  value,
  onChange,
  placeholder,
  className,
  ...props
}: SearchInputProps) => {
  const { t } = useTranslation();
  const ariaLabel = props['aria-label'];
  const ariaLabelledBy = props['aria-labelledby'];
  const resolvedPlaceholder = placeholder ?? t('ui.search.placeholder');

  return (
    <div className="relative w-full min-w-0 sm:min-w-56">
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-spice-text-muted" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={resolvedPlaceholder}
        {...props}
        aria-label={
          ariaLabel ?? (ariaLabelledBy ? undefined : t('ui.search.ariaLabel'))
        }
        className={cn(
          'h-10 w-full min-w-0 rounded-md border border-spice-border-mid bg-spice-bg-surface py-2 pl-9 pr-3 text-sm text-spice-text-primary outline-none focus:ring-2 focus:ring-spice-brand-primary/25',
          className,
        )}
      />
    </div>
  );
};
