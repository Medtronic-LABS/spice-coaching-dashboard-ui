import { useMemo } from 'react';
import { SearchInput } from '@/components/ui';
import { cn } from '@/utils';

export interface PublishedModuleOption {
  id: string;
  title: string;
  domain: string;
}

interface BadgeModuleMultiSelectProps {
  options: PublishedModuleOption[];
  selectedIds: string[];
  onChange: (moduleIds: string[]) => void;
  searchValue: string;
  onSearchChange: (query: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
}

export const BadgeModuleMultiSelect = ({
  options,
  selectedIds,
  onChange,
  searchValue,
  onSearchChange,
  disabled = false,
  isLoading = false,
  emptyMessage = 'No published modules match your search.',
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

  return (
    <div className="space-y-2">
      <div className="w-full">
        <SearchInput
          value={searchValue}
          onChange={onSearchChange}
          placeholder="Search published modules…"
          aria-label="Search published modules"
          disabled={disabled}
        />
      </div>
      <div
        className={cn(
          'max-h-52 overflow-y-auto rounded-xl border border-spice-border bg-spice-bg-surface',
          disabled && 'opacity-60',
        )}
        role="group"
        aria-label="Published modules"
      >
        {isLoading ? (
          <p className="px-3 py-4 text-sm text-spice-text-muted">
            Loading modules…
          </p>
        ) : options.length === 0 ? (
          <p className="px-3 py-4 text-sm text-spice-text-muted">
            {emptyMessage}
          </p>
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
                      className="mt-0.5 h-4 w-4 rounded border-spice-border text-spice-brand-primary focus:ring-spice-brand-primary/30"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggle(option.id)}
                    />
                    <span className="min-w-0">
                      <span className="block font-medium text-spice-text-primary">
                        {option.title}
                      </span>
                      <span className="block text-xs text-spice-text-muted">
                        {option.domain}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
