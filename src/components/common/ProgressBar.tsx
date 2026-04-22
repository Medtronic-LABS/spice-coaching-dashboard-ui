import { cn } from '@/utils';

export interface ProgressBarProps {
  value: number;
  className?: string;
}

export const ProgressBar = ({ value, className }: ProgressBarProps) => {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={cn('h-2 w-full rounded-full bg-slate-100', className)}>
      <div
        className="h-2 rounded-full bg-blue-600 transition-all"
        style={{ width: `${clamped}%` }}
        aria-hidden
      />
      <span className="sr-only">{clamped}% complete</span>
    </div>
  );
};
