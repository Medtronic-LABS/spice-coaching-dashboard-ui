import { type ReactNode } from 'react';
import { Button, Combobox, FilterBar, Select } from '@/components/ui';
import type { ComboboxOption, SelectOption } from '@/components/ui';
import {
  formatModuleDomainLabel,
  hasActiveModuleFilters,
  isDateRangeInvalid,
  type ModuleLibraryFilters as ModuleLibraryFilterState,
} from '@/features/modules/utils/moduleListFilters';
import { cn } from '@/utils';

const dateInputClassName =
  'h-10 w-full rounded-md border border-spice-border-mid bg-spice-bg-surface px-3 text-sm text-spice-text-primary outline-none focus:ring-2 focus:ring-spice-brand-primary/25';

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
      className="text-xs font-semibold text-spice-text-primary"
    >
      {label}
    </label>
    {children}
  </div>
);

export interface ModuleLibraryFiltersProps {
  filters: ModuleLibraryFilterState;
  domains: string[];
  sourceDocumentOptions: ComboboxOption[];
  sourceDocumentId: string;
  sourceDocumentLabel: string;
  sourceDocumentSearch: string;
  sourceDocumentsLoading?: boolean;
  sourceDocumentsHint?: string;
  onSourceDocumentChange: (value: string) => void;
  onSourceDocumentSearchChange: (term: string) => void;
  dateHint?: string;
  onChange: (filters: ModuleLibraryFilterState) => void;
  onClear: () => void;
}

export const ModuleLibraryFilters = ({
  filters,
  domains,
  sourceDocumentOptions,
  sourceDocumentId,
  sourceDocumentLabel,
  sourceDocumentSearch,
  sourceDocumentsLoading = false,
  sourceDocumentsHint,
  onSourceDocumentChange,
  onSourceDocumentSearchChange,
  dateHint,
  onChange,
  onClear,
}: ModuleLibraryFiltersProps) => {
  const dateRangeInvalid = isDateRangeInvalid(filters.dateFrom, filters.dateTo);
  const hasActiveFilters =
    hasActiveModuleFilters(filters) || Boolean(sourceDocumentId);

  const domainOptions: SelectOption[] = [
    { label: 'All domains', value: '' },
    ...domains.map((domain) => ({
      label: formatModuleDomainLabel(domain),
      value: domain,
    })),
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-spice-text-primary">Filters</p>
        {hasActiveFilters ? (
          <Button
            variant="secondary"
            className="h-8 px-3 text-xs"
            onClick={onClear}
          >
            Clear filters
          </Button>
        ) : null}
      </div>

      <FilterBar className="items-end gap-4 p-4">
        <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FilterField
            label="Source document"
            htmlFor="module-filter-source-document"
          >
            <Combobox
              id="module-filter-source-document"
              className="w-full min-w-0"
              value={sourceDocumentId}
              selectedLabel={sourceDocumentLabel}
              options={sourceDocumentOptions}
              searchTerm={sourceDocumentSearch}
              onSearchTermChange={onSourceDocumentSearchChange}
              onChange={onSourceDocumentChange}
              isLoading={sourceDocumentsLoading}
              hint={sourceDocumentsHint}
              placeholder="Type to search documents…"
              emptyMessage="No documents match your search"
            />
          </FilterField>

          <FilterField label="Domain" htmlFor="module-filter-domain">
            <Select
              id="module-filter-domain"
              className="w-full min-w-0"
              value={filters.domain}
              onChange={(domain) => onChange({ ...filters, domain })}
              options={domainOptions}
            />
          </FilterField>

          <FilterField label="From" htmlFor="module-filter-date-from">
            <input
              id="module-filter-date-from"
              type="date"
              className={cn(
                dateInputClassName,
                dateRangeInvalid && 'border-spice-semantic-error',
              )}
              value={filters.dateFrom}
              onChange={(event) =>
                onChange({ ...filters, dateFrom: event.target.value })
              }
            />
          </FilterField>

          <FilterField label="To" htmlFor="module-filter-date-to">
            <input
              id="module-filter-date-to"
              type="date"
              className={cn(
                dateInputClassName,
                dateRangeInvalid && 'border-spice-semantic-error',
              )}
              value={filters.dateTo}
              onChange={(event) =>
                onChange({ ...filters, dateTo: event.target.value })
              }
            />
          </FilterField>
        </div>
      </FilterBar>

      {dateHint ? (
        <p className="text-xs text-spice-text-muted">{dateHint}</p>
      ) : null}
      {dateRangeInvalid ? (
        <p className="text-xs text-spice-semantic-error">
          From date must be on or before to date.
        </p>
      ) : null}
    </div>
  );
};
