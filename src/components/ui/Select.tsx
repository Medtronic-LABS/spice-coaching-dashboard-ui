import { type SelectHTMLAttributes } from 'react';
import { cn } from '@/utils';

/**
 * Select
 * Styled dropdown input for controlled filter selections.
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
  SelectHTMLAttributes<HTMLSelectElement>,
  'onChange' | 'value'
> {
  /** Available options rendered in the dropdown. */
  options: SelectOption[];
  /** Currently selected option value. */
  value: string;
  /** Change callback that receives only the selected value. */
  onChange: (value: string) => void;
}

export const Select = ({
  options,
  value,
  onChange,
  className,
  ...props
}: SelectProps) => {
  return (
    <select
      className={cn(
        'select-arrow h-10 rounded-md border border-spice-border-mid bg-spice-bg-surface px-3 text-sm text-spice-text-primary outline-none focus:ring-2 focus:ring-spice-brand-primary/25',
        className,
      )}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};
