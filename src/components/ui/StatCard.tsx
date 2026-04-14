import { Card } from '@/components/ui/Card';
import { cn } from '@/utils/cn';

/**
 * StatCard
 * KPI card for displaying a metric value and optional numeric change.
 *
 * Usage:
 * <StatCard label="Completion Rate" value="68%" change={5} />
 */
export interface StatCardProps {
  /** Metric label shown above the value. */
  label: string;
  /** Primary metric value. Falls back to `-` when missing. */
  value: string | number;
  /** Optional trend delta in percentage points. */
  change?: number;
}

export const StatCard = ({ label, value, change }: StatCardProps) => {
  const hasChange = typeof change === 'number';
  // Positive is green, negative is red, and undefined uses neutral text.
  const trendClass = hasChange
    ? change >= 0
      ? 'text-green-600'
      : 'text-red-600'
    : 'text-slate-500';

  return (
    <Card variant="bordered" className="space-y-2">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value ?? '-'}</p>
      <p className={cn('text-sm font-medium', trendClass)}>
        {hasChange ? `${change > 0 ? '+' : ''}${change}%` : 'No change'}
      </p>
    </Card>
  );
};
