import { cn } from '@/utils';

export interface ProgressBarProps {
  value: number;
  className?: string;
  barClassName?: string;
}

export const ProgressBar = ({
  value,
  className,
  barClassName,
}: ProgressBarProps) => {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={cn('h-2 w-full rounded-full bg-slate-100', className)}>
      <div
        className={cn(
          'h-2 rounded-full bg-blue-800 transition-all',
          barClassName,
        )}
        style={{ width: `${clamped}%` }}
        aria-hidden
      />
      <span className="sr-only">{clamped}% complete</span>
    </div>
  );
};
