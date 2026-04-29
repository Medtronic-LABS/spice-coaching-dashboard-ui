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
  /** Optional override for the main value color/tone. */
  valueClassName?: string;
}

export const StatCard = ({
  icon,
  label,
  value,
  change,
  supportingText,
  badgeLabel,
  valueClassName,
}: StatCardProps) => {
  const hasChange = typeof change === 'number';
  const trendClass = hasChange ? 'text-spice-text-medium' : undefined;

  return (
    <section
      className={cn(
        'min-w-[160px] flex-1 rounded-md border border-spice-border bg-spice-bg-surface px-5 py-4 shadow-spiceKpi',
        'space-y-1',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {icon ? (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-spice-bg-tint text-spice-text-muted">
              {icon}
            </div>
          ) : null}
          <p className="text-[11px] font-normal text-spice-text-muted">
            {label}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChange ? (
            <span className={cn('text-xs font-semibold', trendClass)}>
              {`${change > 0 ? '+' : ''}${change}%`}
            </span>
          ) : null}
          {badgeLabel ? (
            <span className="rounded-full bg-spice-semantic-errorBg px-2 py-0.5 text-[10px] font-semibold text-spice-semantic-error ring-1 ring-spice-semantic-error/25">
              {badgeLabel}
            </span>
          ) : null}
        </div>
      </div>

      <p
        className={cn(
          'text-[22px] font-bold leading-[1.2] text-spice-text-primary',
          valueClassName,
        )}
      >
        {value ?? '-'}
      </p>

      {supportingText ? (
        <p className="text-[10px] text-spice-text-muted">{supportingText}</p>
      ) : null}
    </section>
  );
};
