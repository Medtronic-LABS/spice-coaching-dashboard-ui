import { type ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils';

/**
 * Button
 * Reusable action trigger with style variants.
 *
 * Usage:
 * <Button variant="primary">Save</Button>
 * <Button size="sm">Compact</Button>
 * <Button size="iconMd" aria-label="Refresh" />
 */
export type ButtonSize = 'sm' | 'md' | 'lg' | 'iconSm' | 'iconMd';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant. Defaults to `primary`. */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Height and padding preset. Defaults to `md`. */
  size?: ButtonSize;
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-spice-brand-primary text-white shadow-spicePrimary hover:bg-spice-palette-purpleHover active:bg-spice-palette-purpleActive focus-visible:ring-spice-brand-primary disabled:bg-spice-border disabled:text-spice-text-muted disabled:shadow-none',
  secondary:
    'bg-spice-bg-surface text-spice-brand-primary ring-1 ring-spice-border hover:bg-spice-palette-purpleLt active:ring-spice-brand-primary focus-visible:ring-spice-brand-primary disabled:text-spice-border disabled:ring-spice-border',
  ghost:
    'bg-transparent text-spice-brand-primary hover:bg-spice-palette-purpleLt focus-visible:ring-spice-brand-primary disabled:text-spice-text-muted/60',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm font-medium',
  md: 'h-9 px-3 text-sm font-medium',
  lg: 'h-10 px-4 text-sm font-medium',
  iconSm: 'h-8 w-8 p-0 text-sm font-medium',
  iconMd: 'h-9 w-9 p-0 text-sm font-medium',
};

export const Button = ({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonProps) => {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-spice-bg-dashboard disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
};
