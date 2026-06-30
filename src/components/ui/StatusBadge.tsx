import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';

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
}

const statusClassMap: Record<StatusBadgeProps['status'], string> = {
  success:
    'bg-spice-semantic-successBg text-spice-semantic-success ring-1 ring-spice-semantic-success/15',
  warning:
    'bg-spice-semantic-warningBg text-spice-semantic-warning ring-1 ring-spice-semantic-warning/15',
  critical:
    'bg-spice-semantic-errorBg text-spice-semantic-error ring-1 ring-spice-semantic-error/15',
  info: 'bg-spice-semantic-infoBg text-spice-semantic-info ring-1 ring-spice-semantic-info/15',
  neutral: 'bg-spice-bg-tint text-spice-text-medium',
};

export const StatusBadge = ({ status, label }: StatusBadgeProps) => {
  return <Badge className={cn(statusClassMap[status])}>{label}</Badge>;
};
