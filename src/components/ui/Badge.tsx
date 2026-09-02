import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils';

/**
 * Badge
 * Generic small label for statuses, tags, or grouped metadata.
 *
 * Usage:
 * <Badge>In Progress</Badge>
 */
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Badge text or custom inline content. */
  children: ReactNode;
  /** Optional class overrides for custom styling. */
  className?: string;
}

export const Badge = ({ children, className, ...rest }: BadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-spice-bg-tint px-2.5 py-1 text-xs font-medium text-spice-text-medium',
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
};
