import { useEffect, useId, useState } from 'react';
import { formatModuleDomainLabel } from '@/features/modules/utils/moduleListFilters';

const FIELD_CLASS =
  'h-10 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm';
const SELECT_CLASS = `select-arrow ${FIELD_CLASS}`;

const OTHER_VALUE = '__other__';

export interface ModuleTaxonomyFieldProps {
  label: string;
  value: string;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  emptyOptionLabel?: string;
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
  disabled = false,
  required = false,
  emptyOptionLabel,
  onChange,
  id: idProp,
}: ModuleTaxonomyFieldProps) => {
  const generatedId = useId();
  const fieldId = idProp ?? generatedId;
  const customInputId = `${fieldId}-custom`;
  const [useCustom, setUseCustom] = useState(false);
  const hasExistingOptions = options.length > 0;
  const inputOnly = !disabled && !hasExistingOptions;

  useEffect(() => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (options.includes(trimmed)) {
      setUseCustom(false);
      return;
    }
    setUseCustom(true);
  }, [value, options]);

  const selectValue = useCustom ? OTHER_VALUE : value;
  const labelContent = (
    <span className="text-xs font-semibold text-spice-text-primary">
      {label}
      {required ? (
        <span className="text-spice-semantic-error" aria-hidden="true">
          {' '}
          *
        </span>
      ) : null}
    </span>
  );

  if (inputOnly) {
    return (
      <label className="block space-y-1" htmlFor={customInputId}>
        {labelContent}
        <input
          id={customInputId}
          className={FIELD_CLASS}
          value={value}
          disabled={disabled}
          required={required}
          placeholder={placeholder ?? `New ${label.toLowerCase()}`}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    );
  }

  return (
    <div className="space-y-1 self-start">
      <label className="block space-y-1" htmlFor={fieldId}>
        {labelContent}
        <select
          id={fieldId}
          className={SELECT_CLASS}
          value={selectValue}
          disabled={disabled}
          required={required}
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
          <option value={OTHER_VALUE}>Enter new…</option>
        </select>
      </label>
      {useCustom ? (
        <input
          id={customInputId}
          className={FIELD_CLASS}
          value={value}
          disabled={disabled}
          required={required}
          placeholder={placeholder ?? `New ${label.toLowerCase()}`}
          aria-label={`New ${label.toLowerCase()}`}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : null}
    </div>
  );
};
