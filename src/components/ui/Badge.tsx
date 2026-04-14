import { type ReactNode } from 'react';
import { cn } from '@/utils/cn';

/**
 * Badge
 * Generic small label for statuses, tags, or grouped metadata.
 *
 * Usage:
 * <Badge>In Progress</Badge>
 */
export interface BadgeProps {
  /** Badge text or custom inline content. */
  children: ReactNode;
  /** Optional class overrides for custom styling. */
  className?: string;
}

export const Badge = ({ children, className }: BadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700',
        className,
      )}
    >
      {children}
    </span>
  );
};
