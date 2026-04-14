import { type ReactNode } from 'react';
import { cn } from '@/utils/cn';

/**
 * FilterBar
 * Horizontal container for filters, search, and utility actions.
 *
 * Usage:
 * <FilterBar><Select ... /><SearchInput ... /></FilterBar>
 */
export interface FilterBarProps {
  children: ReactNode;
  className?: string;
}

export const FilterBar = ({ children, className }: FilterBarProps) => {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-3',
        className,
      )}
    >
      {children}
    </div>
  );
};
