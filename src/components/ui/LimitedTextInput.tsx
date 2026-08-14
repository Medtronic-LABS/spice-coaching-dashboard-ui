import { type InputHTMLAttributes } from 'react';
import { cn } from '@/utils';

export interface LimitedTextInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'maxLength' | 'onChange' | 'value'
> {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  showCounter?: boolean;
  inputClassName?: string;
}

export const LimitedTextInput = ({
  value,
  onChange,
  maxLength,
  showCounter = true,
  className,
  inputClassName,
  disabled,
  id,
  ...props
}: LimitedTextInputProps) => {
  const length = [...value].length;
  const nearLimit = length >= Math.floor(maxLength * 0.9);

  return (
    <div className={cn('space-y-1', className)}>
      <input
        {...props}
        id={id}
        type="text"
        value={value}
        disabled={disabled}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={showCounter && id ? `${id}-counter` : undefined}
        className={cn(
          'h-10 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm text-spice-text-primary outline-none focus:border-spice-brand-primary/40 focus:ring-2 focus:ring-spice-brand-primary/20 disabled:cursor-not-allowed disabled:opacity-60',
          inputClassName,
        )}
      />
      {showCounter ? (
        <div
          id={id ? `${id}-counter` : undefined}
          className={cn(
            'text-right text-[11px] tabular-nums',
            nearLimit
              ? 'font-medium text-spice-semantic-warning'
              : 'text-spice-text-muted',
          )}
          aria-live="polite"
        >
          {length}/{maxLength}
        </div>
      ) : null}
    </div>
  );
};
