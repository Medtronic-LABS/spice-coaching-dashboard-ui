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
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={resolvedPlaceholder}
      aria-label={
        ariaLabel ?? (ariaLabelledBy ? undefined : t('ui.search.ariaLabel'))
      }
      className={cn(
        'h-10 w-full min-w-0 sm:min-w-56 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200',
        className,
      )}
      {...props}
    />
  );
};
