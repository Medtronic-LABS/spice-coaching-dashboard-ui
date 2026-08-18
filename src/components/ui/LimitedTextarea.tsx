import { type TextareaHTMLAttributes } from 'react';
import { SPICE_INPUT_FOCUS_CLASSNAME } from '@/constants/formControls';
import { cn } from '@/utils';

export interface LimitedTextareaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'maxLength' | 'onChange' | 'value'
> {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  showCounter?: boolean;
  textareaClassName?: string;
}

export const LimitedTextarea = ({
  value,
  onChange,
  maxLength,
  showCounter = true,
  className,
  textareaClassName,
  disabled,
  id,
  ...props
}: LimitedTextareaProps) => {
  const length = value.length;
  const nearLimit = length >= Math.floor(maxLength * 0.9);

  return (
    <div className={cn('space-y-1', className)}>
      <textarea
        {...props}
        id={id}
        value={value}
        disabled={disabled}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={showCounter && id ? `${id}-counter` : undefined}
        className={cn(
          'min-h-[84px] w-full resize-y rounded-lg border border-spice-border-mid bg-spice-bg-surface px-3 py-2 text-sm text-spice-text-primary caret-spice-palette-purple disabled:cursor-not-allowed disabled:opacity-60',
          SPICE_INPUT_FOCUS_CLASSNAME,
          textareaClassName,
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
