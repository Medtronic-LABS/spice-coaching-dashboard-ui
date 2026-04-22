import { type ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

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
    'bg-blue-800 text-white hover:bg-blue-700 focus-visible:ring-blue-400 disabled:bg-blue-300',
  secondary:
    'bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-100 focus-visible:ring-slate-400',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-400',
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
        'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
};
