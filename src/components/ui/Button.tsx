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
    'bg-spice-brand-primary text-white shadow-spicePrimary hover:bg-spice-palette-purpleHover active:bg-spice-palette-purpleActive focus-visible:ring-spice-brand-primary disabled:bg-spice-border disabled:text-spice-text-muted disabled:shadow-none',
  secondary:
    'bg-spice-bg-surface text-spice-brand-primary ring-1 ring-spice-border hover:bg-spice-palette-purpleLt active:ring-spice-brand-primary focus-visible:ring-spice-brand-primary disabled:text-spice-border disabled:ring-spice-border',
  ghost:
    'bg-transparent text-spice-brand-primary hover:bg-spice-palette-purpleLt focus-visible:ring-spice-brand-primary disabled:text-spice-text-muted/60',
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
        'inline-flex items-center justify-center rounded-sm px-3 py-2 text-[13px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-spice-bg-dashboard disabled:cursor-not-allowed',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
};
