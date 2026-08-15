import { type SelectHTMLAttributes } from 'react';
import { SPICE_INPUT_FOCUS_CLASSNAME } from '@/constants/formControls';
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
        'select-arrow h-10 rounded-sm border border-spice-border-mid bg-spice-bg-surface px-3 text-[13px] text-spice-text-primary',
        SPICE_INPUT_FOCUS_CLASSNAME,
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
