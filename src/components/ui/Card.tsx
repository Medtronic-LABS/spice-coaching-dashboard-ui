import { type ReactNode } from 'react';
import { cn } from '@/utils';

/**
 * Card
 * Base surface container for reusable dashboard blocks and grouped content.
 *
 * Usage:
 * <Card variant="elevated">Content</Card>
 */
export interface CardProps {
  /** Content rendered inside the card container. */
  children: ReactNode;
  /** Visual surface style. Defaults to `default`. */
  variant?: 'default' | 'bordered' | 'elevated';
  /** Optional extra classes for layout-level customization. */
  className?: string;
}

const variantClasses: Record<NonNullable<CardProps['variant']>, string> = {
  default: 'bg-spice-bg-surface',
  bordered: 'bg-spice-bg-surface border border-spice-border',
  elevated: 'bg-spice-bg-surface shadow-spiceCard',
};

export const Card = ({
  children,
  variant = 'default',
  className,
}: CardProps) => {
  return (
    <section
      className={cn(
        'rounded-xl p-4 md:p-6',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </section>
  );
};
