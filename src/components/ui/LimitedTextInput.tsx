import { type InputHTMLAttributes } from 'react';
import { SPICE_INPUT_FOCUS_CLASSNAME } from '@/constants/formControls';
import { cn } from '@/utils';

export type LimitedTextInputCounterPlacement = 'below' | 'inline';

export interface LimitedTextInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'maxLength' | 'onChange' | 'value'
> {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  showCounter?: boolean;
  counterPlacement?: LimitedTextInputCounterPlacement;
  inputClassName?: string;
}

export const LimitedTextInput = ({
  value,
  onChange,
  maxLength,
  showCounter = true,
  counterPlacement = 'below',
  className,
  inputClassName,
  disabled,
  id,
  ...props
}: LimitedTextInputProps) => {
  const length = [...value].length;
  const nearLimit = length >= Math.floor(maxLength * 0.9);
  const isInline = showCounter && counterPlacement === 'inline';

  return (
    <div
      className={cn(
        isInline ? 'flex min-w-0 items-center gap-2' : 'space-y-1',
        className,
      )}
    >
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
          'h-10 w-full rounded-lg border border-spice-border-mid bg-spice-bg-surface px-3 text-sm text-spice-text-primary caret-spice-palette-purple disabled:cursor-not-allowed disabled:opacity-60',
          isInline && 'min-w-0 flex-1',
          SPICE_INPUT_FOCUS_CLASSNAME,
          inputClassName,
        )}
      />
      {showCounter ? (
        <div
          id={id ? `${id}-counter` : undefined}
          className={cn(
            'text-right text-xs tabular-nums',
            isInline && 'shrink-0',
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
