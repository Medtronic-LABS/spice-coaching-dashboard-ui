import { type InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

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

export const SearchInput = ({
  value,
  onChange,
  placeholder = 'Search...',
  className,
  ...props
}: SearchInputProps) => {
  const ariaLabel = props['aria-label'];
  const ariaLabelledBy = props['aria-labelledby'];

  return (
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel ?? (ariaLabelledBy ? undefined : 'Search')}
      className={cn(
        'h-10 w-full min-w-0 sm:min-w-56 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200',
        className,
      )}
      {...props}
    />
  );
};
