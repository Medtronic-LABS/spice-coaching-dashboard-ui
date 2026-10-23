import { cn } from '@/utils';

export interface ProgressBarProps {
  value?: number;
  /** Sliding loader animation used when exact progress is unknown. */
  indeterminate?: boolean;
  className?: string;
  barClassName?: string;
}

export const ProgressBar = ({
  value = 0,
  indeterminate = false,
  className,
  barClassName,
}: ProgressBarProps) => {
  if (indeterminate) {
    return (
      <div
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-full bg-spice-bg-tint',
          className,
        )}
        role="progressbar"
        aria-valuetext="In progress"
      >
        <div
          className={cn(
            'absolute inset-y-0 w-1/3 rounded-full bg-spice-brand-primary',
            'animate-progress-indeterminate',
            barClassName,
          )}
          aria-hidden
        />
        <span className="sr-only">In progress</span>
      </div>
    );
  }

  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      className={cn('h-2 w-full rounded-full bg-spice-bg-tint', className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          'h-2 rounded-full bg-spice-brand-primary transition-all',
          barClassName,
        )}
        style={{ width: `${clamped}%` }}
        aria-hidden
      />
      <span className="sr-only">{clamped}% complete</span>
    </div>
  );
};
