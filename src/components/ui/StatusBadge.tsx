import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils';

/**
 * StatusBadge
 * Color-coded badge variant for semantic statuses.
 *
 * Usage:
 * <StatusBadge status="success" label="Active" />
 * <StatusBadge status="success" label="Active" className={TABLE_STATUS_BADGE_CLASSNAME} />
 */
export interface StatusBadgeProps {
  status: 'success' | 'warning' | 'critical' | 'info' | 'neutral';
  label: string;
  className?: string;
}

/** Shared capsule sizing for every semantic status badge. */
export const STATUS_BADGE_CLASSNAME =
  'h-6 whitespace-nowrap px-2.5 py-0 text-xs font-semibold leading-none tracking-wide justify-center text-center';

/** Extra width for status values in admin data tables. */
export const TABLE_STATUS_BADGE_CLASSNAME = 'min-w-[8.5rem]';

const statusClassMap: Record<StatusBadgeProps['status'], string> = {
  success:
    'bg-spice-palette-purpleLt text-spice-palette-purple ring-1 ring-spice-palette-purple/15',
  warning:
    'bg-spice-palette-pinkLt text-spice-palette-pink ring-1 ring-spice-palette-pink/15',
  critical:
    'bg-spice-palette-pinkLt text-spice-logout-text ring-1 ring-spice-logout-border',
  info: 'bg-spice-palette-violetLt text-spice-palette-violet ring-1 ring-spice-palette-violet/15',
  neutral: 'bg-spice-bg-tint text-spice-text-medium ring-1 ring-spice-border',
};

export const StatusBadge = ({ status, label, className }: StatusBadgeProps) => {
  return (
    <Badge
      className={cn(STATUS_BADGE_CLASSNAME, statusClassMap[status], className)}
    >
      {label}
    </Badge>
  );
};
