import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils';

/**
 * Badge
 * Generic small label for statuses, tags, or grouped metadata.
 *
 * Usage:
 * <Badge>In Progress</Badge>
 * <Badge variant="outline" size="sm">Tag</Badge>
 */
export type BadgeVariant = 'default' | 'outline' | 'subtle';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Badge text or custom inline content. */
  children: ReactNode;
  /** Visual style variant. Defaults to `default`. */
  variant?: BadgeVariant;
  /** Size preset. Defaults to `md`. */
  size?: BadgeSize;
  /** Optional class overrides for custom styling. */
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-spice-bg-tint text-spice-text-medium',
  outline:
    'bg-spice-bg-surface text-spice-text-medium ring-1 ring-spice-border',
  subtle:
    'bg-spice-bg-surface/80 text-spice-text-muted ring-1 ring-spice-border/60',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
};

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className,
  ...rest
}: BadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
};
