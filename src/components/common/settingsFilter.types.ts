import type { ComboboxOption, SelectOption } from '@/components/ui';

export interface SettingsFilterCheckboxOption {
  label: string;
  value: string;
}

export interface SettingsFilterComboboxField {
  type: 'combobox';
  id: string;
  label: string;
  className?: string;
  value: string;
  selectedLabel: string;
  options: ComboboxOption[];
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  onChange: (value: string) => void;
  isLoading?: boolean;
  hint?: string;
  placeholder?: string;
  emptyMessage?: string;
}

export interface SettingsFilterSelectField {
  type: 'select';
  id: string;
  label: string;
  className?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}

export interface SettingsFilterCheckboxGroupField {
  type: 'checkbox-group';
  id: string;
  label: string;
  className?: string;
  description?: string;
  values: string[];
  options: SettingsFilterCheckboxOption[];
  onToggle: (value: string) => void;
  /** Option layout. `2` shows two per row from `sm` up; stacks on smaller widths. Default `1`. */
  columns?: 1 | 2;
}

export interface SettingsFilterDateRangeEndpoint {
  id: string;
  value: string;
  ariaLabel: string;
  onChange: (value: string) => void;
}

export interface SettingsFilterDateRangeField {
  type: 'date-range';
  id: string;
  label: string;
  className?: string;
  from: SettingsFilterDateRangeEndpoint;
  to: SettingsFilterDateRangeEndpoint;
  invalid?: boolean;
  errorMessage?: string;
}

export type SettingsFilterField =
  | SettingsFilterComboboxField
  | SettingsFilterSelectField
  | SettingsFilterCheckboxGroupField
  | SettingsFilterDateRangeField;

export interface SettingsFilterSection {
  id: string;
  label: string;
  fields: SettingsFilterField[];
  /** Field layout. `2` shows two fields per row from `sm` up; stacks on smaller widths. Default `1`. */
  columns?: 1 | 2;
}
