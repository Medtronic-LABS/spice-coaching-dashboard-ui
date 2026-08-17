import { useMemo } from 'react';
import {
  InfiniteScrollContainer,
  SearchInput,
  TruncatedText,
} from '@/components/ui';
import { TABLE_CELL_LABEL_MAX_LENGTH } from '@/constants/fieldLimits';
import { SPICE_CHECKBOX_CLASSNAME } from '@/constants/formControls';
import { formatModuleDomainLabel } from '@/features/modules/utils/moduleListFilters';
import { cn } from '@/utils';

export interface PublishedModuleOption {
  id: string;
  title: string;
  /** Catalog domain value used for API write payloads. */
  domain: string;
}

interface BadgeModuleMultiSelectProps {
  options: PublishedModuleOption[];
  selectedIds: string[];
  onChange: (moduleIds: string[]) => void;
  searchValue: string;
  onSearchChange: (query: string) => void;
  disabled?: boolean;
  /** When false, hides the search field (e.g. view-only selected list). */
  showSearch?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  loadMoreError?: boolean;
  onLoadMoreRetry?: () => void;
}

export const BadgeModuleMultiSelect = ({
  options,
  selectedIds,
  onChange,
  searchValue,
  onSearchChange,
  disabled = false,
  showSearch = true,
  isLoading = false,
  emptyMessage = 'No published modules match your search.',
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
  loadMoreError = false,
  onLoadMoreRetry,
}: BadgeModuleMultiSelectProps) => {
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const toggle = (moduleId: string) => {
    if (disabled) return;
    if (selectedSet.has(moduleId)) {
      onChange(selectedIds.filter((id) => id !== moduleId));
      return;
    }
    onChange([...selectedIds, moduleId]);
  };

  const listBody = isLoading ? (
    <p className="px-3 py-4 text-sm text-spice-text-muted">Loading modules…</p>
  ) : options.length === 0 ? (
    <p className="px-3 py-4 text-sm text-spice-text-muted">{emptyMessage}</p>
  ) : (
    <ul className="divide-y divide-spice-border">
      {options.map((option) => {
        const checked = selectedSet.has(option.id);
        return (
          <li key={option.id}>
            <label
              className={cn(
                'flex cursor-pointer items-start gap-3 px-3 py-2.5 text-sm transition',
                checked
                  ? 'bg-spice-brand-primary/[0.06]'
                  : 'hover:bg-spice-bg-tint',
              )}
            >
              <input
                type="checkbox"
                className={cn(SPICE_CHECKBOX_CLASSNAME, 'mt-0.5')}
                checked={checked}
                disabled={disabled}
                onChange={() => toggle(option.id)}
              />
              <span className="min-w-0 flex-1">
                <TruncatedText
                  text={option.title}
                  maxChars={TABLE_CELL_LABEL_MAX_LENGTH}
                  focusable
                  className="font-medium text-spice-text-primary"
                />
                <span className="block text-xs text-spice-text-muted">
                  {formatModuleDomainLabel(option.domain)}
                </span>
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="space-y-2">
      {showSearch ? (
        <div className="w-full">
          <SearchInput
            value={searchValue}
            onChange={onSearchChange}
            placeholder="Search published modules…"
            aria-label="Search published modules"
            disabled={disabled}
          />
        </div>
      ) : null}
      {onLoadMore ? (
        <InfiniteScrollContainer
          className={cn(
            'max-h-64 rounded-xl border border-spice-border bg-spice-bg-surface',
            disabled && 'opacity-60',
          )}
          hasMore={!isLoading && !disabled && hasMore}
          onLoadMore={onLoadMore}
          loadedCount={options.length}
          isLoadingMore={isLoadingMore}
          error={loadMoreError}
          onRetry={onLoadMoreRetry}
          disabled={isLoading || disabled}
          loadingMessage="Loading more modules…"
          errorMessage="Failed to load more modules."
        >
          <div role="group" aria-label="Published modules">
            {listBody}
          </div>
        </InfiniteScrollContainer>
      ) : (
        <div
          className={cn(
            'max-h-64 overflow-y-auto rounded-xl border border-spice-border bg-spice-bg-surface',
            disabled && 'opacity-60',
          )}
          role="group"
          aria-label="Published modules"
        >
          {listBody}
        </div>
      )}
    </div>
  );
};
