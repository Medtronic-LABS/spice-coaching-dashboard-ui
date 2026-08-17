import { type InputHTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';
import { SearchIcon } from '@/assets/icon';
import { SPICE_INPUT_FOCUS_CLASSNAME } from '@/constants/formControls';
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
    <div className="relative w-full min-w-0 sm:min-w-56">
      <SearchIcon
        data-testid="search-input-icon"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-spice-brand-primary"
      />
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
          'h-10 w-full min-w-0 rounded-sm border border-spice-border-mid bg-spice-bg-surface py-2 pl-9 pr-3 text-[13px] text-spice-text-primary caret-spice-palette-purple',
          SPICE_INPUT_FOCUS_CLASSNAME,
          className,
        )}
      />
    </div>
  );
};
