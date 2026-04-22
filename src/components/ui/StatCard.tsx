import { Card } from '@/components/ui/Card';
import { cn } from '@/utils';
import type { ReactNode } from 'react';

/**
 * StatCard
 * KPI card for displaying a metric value and optional numeric change.
 *
 * Usage:
 * <StatCard label="Completion Rate" value="68%" change={5} />
 */
export interface StatCardProps {
  /** Optional icon shown beside the label. */
  icon?: ReactNode;
  /** Metric label shown above the value. */
  label: string;
  /** Primary metric value. Falls back to `-` when missing. */
  value: string | number;
  /** Optional trend delta in percentage points. */
  change?: number;
  /** Optional helper line under the value. */
  supportingText?: string;
  /** Optional badge text (e.g. ALERT). */
  badgeLabel?: string;
}

export const StatCard = ({
  icon,
  label,
  value,
  change,
  supportingText,
  badgeLabel,
}: StatCardProps) => {
  const hasChange = typeof change === 'number';
  const trendClass = hasChange
    ? change >= 0
      ? 'text-[color:var(--c-mako)]'
      : 'text-[color:var(--c-mako)]'
    : undefined;

  return (
    <Card variant="elevated" className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {icon ? (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              {icon}
            </div>
          ) : null}
          <p className="text-xs font-medium text-slate-500">{label}</p>
        </div>
        <div className="flex items-center gap-2">
          {hasChange ? (
            <span className={cn('text-xs font-semibold', trendClass)}>
              {`${change > 0 ? '+' : ''}${change}%`}
            </span>
          ) : null}
          {badgeLabel ? (
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 ring-1 ring-red-200">
              {badgeLabel}
            </span>
          ) : null}
        </div>
      </div>
      <p className="text-3xl font-semibold leading-none text-slate-900">
        {value ?? '-'}
      </p>
      {supportingText ? (
        <p className="text-xs text-slate-500">{supportingText}</p>
      ) : null}
    </Card>
  );
};
