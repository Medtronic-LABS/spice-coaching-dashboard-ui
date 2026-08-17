import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils';

/**
 * StatusBadge
 * Color-coded badge variant for semantic statuses.
 *
 * Usage:
 * <StatusBadge status="success" label="Active" />
 */
export interface StatusBadgeProps {
  status: 'success' | 'warning' | 'critical' | 'info' | 'neutral';
  label: string;
  className?: string;
}

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
      className={cn(
        'min-w-[6.5rem] justify-center px-2.5 py-1 text-center text-[10px] font-semibold tracking-wide',
        statusClassMap[status],
        className,
      )}
    >
      {label}
    </Badge>
  );
};
