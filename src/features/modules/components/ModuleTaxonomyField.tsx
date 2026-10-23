import { useEffect, useId, useState } from 'react';
import { FormLabel, LimitedTextInput } from '@/components/ui';
import { FIELD_LIMITS } from '@/constants/fieldLimits';
import { formatModuleDomainLabel } from '@/features/modules/utils/moduleListFilters';
import { cn } from '@/utils';

const FIELD_CLASS =
  'h-10 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm';

const OTHER_VALUE = '__other__';

export interface ModuleTaxonomyFieldProps {
  label: string;
  value: string;
  options: string[];
  placeholder?: string;
  customOptionLabel?: string;
  disabled?: boolean;
  required?: boolean;
  emptyOptionLabel?: string;
  hideLabel?: boolean;
  showCounter?: boolean;
  inputClassName?: string;
  onChange: (value: string) => void;
  id?: string;
}

/**
 * Dropdown of existing taxonomy values plus an explicit path to enter a new one.
 * When there are no existing options, shows a text input only (no redundant dropdown).
 */
export const ModuleTaxonomyField = ({
  label,
  value,
  options,
  placeholder,
  customOptionLabel,
  disabled = false,
  required = false,
  emptyOptionLabel,
  hideLabel = false,
  showCounter = true,
  inputClassName,
  onChange,
  id: idProp,
}: ModuleTaxonomyFieldProps) => {
  const generatedId = useId();
  const fieldId = idProp ?? generatedId;
  const customInputId = `${fieldId}-custom`;
  const [useCustom, setUseCustom] = useState(false);
  const hasExistingOptions = options.length > 0;
  const inputOnly = !disabled && !hasExistingOptions;
  const fieldClass = cn(FIELD_CLASS, inputClassName);
  const selectClass = cn('select-arrow', fieldClass);

  useEffect(() => {
    // Keep custom-entry until the user picks an existing option.
    if (useCustom) {
      return;
    }
    const trimmed = value.trim();
    if (!trimmed) return;
    if (!options.includes(trimmed)) {
      setUseCustom(true);
    }
  }, [options, useCustom, value]);

  const selectValue = useCustom ? OTHER_VALUE : value;
  const labelContent = hideLabel ? null : (
    <FormLabel required={required}>{label}</FormLabel>
  );

  if (inputOnly) {
    return (
      <div className="block space-y-1">
        {labelContent ? (
          <label className="block" htmlFor={customInputId}>
            {labelContent}
          </label>
        ) : null}
        <LimitedTextInput
          id={customInputId}
          value={value}
          disabled={disabled}
          required={required}
          maxLength={FIELD_LIMITS.taxonomy}
          showCounter={showCounter}
          placeholder={placeholder ?? `New ${label.toLowerCase()}`}
          aria-label={hideLabel ? label : undefined}
          inputClassName={fieldClass}
          onChange={onChange}
        />
      </div>
    );
  }

  return (
    <div className="space-y-1 self-start">
      <label className="block space-y-1" htmlFor={fieldId}>
        {labelContent}
        <select
          id={fieldId}
          className={selectClass}
          value={selectValue}
          disabled={disabled}
          required={required}
          aria-label={hideLabel ? label : undefined}
          onChange={(event) => {
            const nextValue = event.target.value;
            if (nextValue === OTHER_VALUE) {
              setUseCustom(true);
              onChange('');
              return;
            }
            setUseCustom(false);
            onChange(nextValue);
          }}
        >
          <option value="">
            {emptyOptionLabel ?? `Select ${label.toLowerCase()}`}
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {formatModuleDomainLabel(option)}
            </option>
          ))}
          <option value={OTHER_VALUE}>
            {customOptionLabel ?? 'Enter new…'}
          </option>
        </select>
      </label>
      {useCustom ? (
        <LimitedTextInput
          id={customInputId}
          value={value}
          disabled={disabled}
          required={required}
          maxLength={FIELD_LIMITS.taxonomy}
          showCounter={showCounter}
          placeholder={placeholder ?? `New ${label.toLowerCase()}`}
          aria-label={`New ${label.toLowerCase()}`}
          inputClassName={fieldClass}
          onChange={onChange}
        />
      ) : null}
    </div>
  );
};
