import { type ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils';

/**
 * Button
 * Reusable action trigger with style variants.
 *
 * Usage:
 * <Button variant="primary">Save</Button>
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant. Defaults to `primary`. */
  variant?: 'primary' | 'secondary' | 'ghost';
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-spice-brand-primary text-white shadow-spicePrimary hover:opacity-95 focus-visible:ring-spice-brand-primary disabled:opacity-50',
  secondary:
    'bg-spice-bg-surface text-spice-text-primary ring-1 ring-spice-border-mid hover:bg-spice-bg-tint focus-visible:ring-spice-border-mid',
  ghost:
    'bg-transparent text-spice-text-medium hover:bg-spice-bg-tint focus-visible:ring-spice-border-mid',
};

export const Button = ({
  variant = 'primary',
  className,
  type = 'button',
  ...props
}: ButtonProps) => {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-spice-bg-dashboard disabled:cursor-not-allowed',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
};
