import { type ReactNode } from 'react';
import { Button, Combobox, Select } from '@/components/ui';
import type {
  SettingsFilterCheckboxGroupField,
  SettingsFilterDateRangeField,
  SettingsFilterField,
  SettingsFilterSection,
} from '@/components/common/settingsFilter.types';
import { cn } from '@/utils';

const dateInputClassName =
  'h-10 w-full rounded-lg border border-spice-border-mid bg-spice-bg-surface px-3 text-sm text-spice-text-primary outline-none transition focus:border-spice-brand-primary/40 focus:ring-2 focus:ring-spice-brand-primary/20';

interface FilterFieldProps {
  label: string;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}

const FilterField = ({
  label,
  htmlFor,
  className,
  children,
}: FilterFieldProps) => (
  <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
    <label
      htmlFor={htmlFor}
      className="text-xs font-semibold tracking-wide text-spice-text-medium"
    >
      {label}
    </label>
    {children}
  </div>
);

const SectionLabel = ({ children }: { children: ReactNode }) => (
  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-spice-text-muted">
    {children}
  </p>
);

function renderCheckboxGroup(field: SettingsFilterCheckboxGroupField) {
  const columns = field.columns ?? 1;
  return (
    <div
      className={cn(
        'space-y-3 rounded-xl bg-spice-bg-tint/70 p-4 ring-1 ring-spice-border',
        field.className,
      )}
    >
      <p className="text-sm font-semibold text-spice-text-primary">
        {field.label}
      </p>
      {field.description ? (
        <p className="text-sm text-spice-text-medium">{field.description}</p>
      ) : null}
      <div
        className={cn(
          'gap-2',
          columns === 2 ? 'grid grid-cols-1 sm:grid-cols-2' : 'flex flex-col',
        )}
      >
        {field.options.map((option) => {
          const checked = field.values.includes(option.value);
          return (
            <label
              key={option.value}
              className={cn(
                'flex min-w-0 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition',
                checked
                  ? 'border-spice-brand-primary/40 bg-spice-brand-primary/[0.06]'
                  : 'border-spice-border bg-spice-bg-surface hover:bg-spice-bg-tint',
              )}
            >
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0 rounded border-spice-border-mid text-spice-brand-primary focus:ring-spice-brand-primary/30"
                checked={checked}
                onChange={() => field.onToggle(option.value)}
              />
              <span className="min-w-0 text-sm font-medium text-spice-text-primary">
                {option.label}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function renderDateRange(field: SettingsFilterDateRangeField) {
  return (
    <div
      className={cn(
        'space-y-3 rounded-xl bg-spice-bg-tint/70 p-4 ring-1 ring-spice-border',
        field.className,
      )}
    >
      <p className="text-sm font-semibold text-spice-text-primary">
        {field.label}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FilterField label="From" htmlFor={field.from.id}>
          <input
            id={field.from.id}
            type="date"
            aria-label={field.from.ariaLabel}
            className={cn(
              dateInputClassName,
              field.invalid && 'border-spice-semantic-error',
            )}
            value={field.from.value}
            onChange={(event) => field.from.onChange(event.target.value)}
          />
        </FilterField>
        <FilterField label="To" htmlFor={field.to.id}>
          <input
            id={field.to.id}
            type="date"
            aria-label={field.to.ariaLabel}
            className={cn(
              dateInputClassName,
              field.invalid && 'border-spice-semantic-error',
            )}
            value={field.to.value}
            onChange={(event) => field.to.onChange(event.target.value)}
          />
        </FilterField>
      </div>
      {field.invalid && field.errorMessage ? (
        <p className="text-xs text-spice-semantic-error">
          {field.errorMessage}
        </p>
      ) : null}
    </div>
  );
}

function renderField(field: SettingsFilterField) {
  if (field.type === 'combobox') {
    return (
      <FilterField
        key={field.id}
        label={field.label}
        htmlFor={field.id}
        className={field.className}
      >
        <Combobox
          id={field.id}
          className="w-full min-w-0"
          value={field.value}
          selectedLabel={field.selectedLabel}
          options={field.options}
          searchTerm={field.searchTerm}
          onSearchTermChange={field.onSearchTermChange}
          onChange={field.onChange}
          isLoading={field.isLoading}
          hint={field.hint}
          placeholder={field.placeholder}
          emptyMessage={field.emptyMessage}
        />
      </FilterField>
    );
  }

  if (field.type === 'select') {
    return (
      <FilterField
        key={field.id}
        label={field.label}
        htmlFor={field.id}
        className={field.className}
      >
        <Select
          id={field.id}
          className="w-full min-w-0 rounded-lg"
          value={field.value}
          onChange={field.onChange}
          options={field.options}
        />
      </FilterField>
    );
  }

  if (field.type === 'checkbox-group') {
    return <div key={field.id}>{renderCheckboxGroup(field)}</div>;
  }

  return <div key={field.id}>{renderDateRange(field)}</div>;
}

interface SettingsFilterRendererProps {
  sections: SettingsFilterSection[];
  onClearAll: () => void;
  onApply: () => void;
  applyDisabled?: boolean;
}

export const SettingsFilterRenderer = ({
  sections,
  onClearAll,
  onApply,
  applyDisabled = false,
}: SettingsFilterRendererProps) => {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        {sections.map((section) => (
          <section key={section.id} className="space-y-3">
            <SectionLabel>{section.label}</SectionLabel>
            <div
              className={cn(
                'gap-3',
                (section.columns ?? 1) === 2
                  ? 'grid grid-cols-1 sm:grid-cols-2'
                  : 'flex flex-col',
              )}
            >
              {section.fields.map((field) => renderField(field))}
            </div>
          </section>
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-3 border-t border-spice-border bg-spice-bg-surface/95 px-5 py-4 backdrop-blur-sm">
        <Button
          variant="ghost"
          className="h-10 px-4 text-sm"
          onClick={onClearAll}
        >
          Clear All
        </Button>
        <Button
          className="ml-auto h-10 min-w-[7.5rem] px-5 text-sm"
          onClick={onApply}
          disabled={applyDisabled}
        >
          Apply
        </Button>
      </div>
    </div>
  );
};
