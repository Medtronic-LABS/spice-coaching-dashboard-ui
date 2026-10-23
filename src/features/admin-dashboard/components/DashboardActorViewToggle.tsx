import { cn } from '@/utils';
import type { DashboardActorView } from '@/features/admin-dashboard/types/dashboard.types';

const ACTOR_VIEW_OPTIONS: Array<{
  value: DashboardActorView;
  label: string;
}> = [
  { value: 'sk', label: 'SKs' },
  { value: 'po', label: 'POs' },
];

interface DashboardActorViewToggleProps {
  value: DashboardActorView;
  onChange: (value: DashboardActorView) => void;
  className?: string;
  /** Accessible name for the control group. */
  label?: string;
}

/** Compact SKs | POs pill for digital-help / suggestion actor filtering. */
export const DashboardActorViewToggle = ({
  value,
  onChange,
  className,
  label = 'Actor view',
}: DashboardActorViewToggleProps) => {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'inline-flex shrink-0 items-center rounded-full bg-spice-bg-tint p-0.5',
        className,
      )}
    >
      {ACTOR_VIEW_OPTIONS.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            className={cn(
              'h-7 min-w-[2.75rem] rounded-full px-3 text-xs font-semibold leading-none transition',
              isActive
                ? 'bg-spice-brand-primary text-white shadow-sm'
                : 'bg-transparent text-spice-text-primary hover:text-spice-brand-primary',
            )}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
