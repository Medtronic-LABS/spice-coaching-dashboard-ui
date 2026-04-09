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
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  critical: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  neutral: 'bg-slate-100 text-slate-700',
};

export const StatusBadge = ({ status, label }: StatusBadgeProps) => {
  return <Badge className={cn(statusClassMap[status])}>{label}</Badge>;
};
