import type { ReactNode } from 'react';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn } from '@/utils';

/**
 * StatCard
 * KPI card for displaying a metric value and optional numeric change.
 *
 * Accent styling mirrors Needs Review module cards (`border-l-4`),
 * but uses a top accent (`border-t-4`) for dashboard metrics.
 *
 * Usage:
 * <StatCard label="Completion Rate" value="68%" change={5} />
 * <StatCard tone="pink" label="SKs active now" value={127} outOf={155} tooltip="..." />
 */
export type StatCardTone = 'pink' | 'amber' | 'blue' | 'violet' | 'purple';

export interface StatCardProps {
  /** Optional icon shown above the label. */
  icon?: ReactNode;
  /** Metric label shown above the value. */
  label: string;
  /** Primary metric value. Falls back to `-` when missing. */
  value: string | number;
  /** Optional denominator for fraction display (`value/outOf`). */
  outOf?: string | number;
  /** Optional trend delta in percentage points. */
  change?: number;
  /** Optional helper line under the value. */
  supportingText?: string;
  /** Optional badge text (e.g. ALERT). */
  badgeLabel?: string;
  /** Optional override for the main value color/tone. */
  valueClassName?: string;
  /** Accent tone for top border, icon tile, and primary value. */
  tone?: StatCardTone;
  /** Optional info tooltip shown on the top-right control. */
  tooltip?: string;
  /** Accessible name for the tooltip trigger. Defaults to the label. */
  tooltipLabel?: string;
}

const TONE_STYLES: Record<
  StatCardTone,
  { border: string; iconBg: string; iconFg: string; value: string }
> = {
  pink: {
    border: 'border-t-pink-500',
    iconBg: 'bg-pink-500/10',
    iconFg: 'text-pink-600',
    value: 'text-pink-600',
  },
  amber: {
    border: 'border-t-amber-500',
    iconBg: 'bg-amber-500/10',
    iconFg: 'text-amber-700',
    value: 'text-amber-700',
  },
  blue: {
    border: 'border-t-blue-500',
    iconBg: 'bg-blue-500/10',
    iconFg: 'text-blue-700',
    value: 'text-blue-700',
  },
  violet: {
    border: 'border-t-violet-500',
    iconBg: 'bg-violet-500/10',
    iconFg: 'text-violet-700',
    value: 'text-violet-700',
  },
  purple: {
    border: 'border-t-purple-500',
    iconBg: 'bg-purple-500/10',
    iconFg: 'text-purple-700',
    value: 'text-purple-700',
  },
};

export const StatCard = ({
  icon,
  label,
  value,
  outOf,
  change,
  supportingText,
  badgeLabel,
  valueClassName,
  tone,
  tooltip,
  tooltipLabel,
}: StatCardProps) => {
  const hasChange = typeof change === 'number';
  const toneStyles = tone ? TONE_STYLES[tone] : null;
  const displayValue = value ?? '-';
  const hasOutOf = outOf !== undefined && outOf !== null && outOf !== '';

  return (
    <section
      className={cn(
        'relative min-w-[160px] flex-1 overflow-hidden rounded-xl border border-spice-border bg-spice-bg-surface p-4 shadow-sm transition-all hover:shadow-md',
        toneStyles ? cn('border-t-4', toneStyles.border) : null,
      )}
    >
      {tooltip ? (
        <div className="absolute right-3 top-3 z-10">
          <Tooltip
            label={tooltipLabel ?? label}
            content={tooltip}
            placement="bottom"
            className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-spice-border bg-spice-bg-surface text-[11px] font-bold leading-none text-spice-text-muted transition-colors hover:border-spice-brand-primary hover:text-spice-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spice-brand-primary/30"
          >
            <span aria-hidden="true">i</span>
          </Tooltip>
        </div>
      ) : null}

      {(hasChange || badgeLabel) && !tooltip ? (
        <div className="absolute right-3 top-3 flex items-center gap-2">
          {hasChange ? (
            <span className="text-xs font-semibold text-spice-text-medium">
              {`${change > 0 ? '+' : ''}${change}%`}
            </span>
          ) : null}
          {badgeLabel ? (
            <span className="rounded-full bg-spice-semantic-errorBg px-2 py-0.5 text-[10px] font-semibold text-spice-semantic-error ring-1 ring-spice-semantic-error/25">
              {badgeLabel}
            </span>
          ) : null}
        </div>
      ) : null}

      {icon ? (
        <div
          className={cn(
            'mb-3 flex h-8 w-8 items-center justify-center rounded-lg',
            toneStyles?.iconBg ?? 'bg-spice-bg-tint',
            toneStyles?.iconFg ?? 'text-spice-text-muted',
          )}
        >
          {icon}
        </div>
      ) : null}

      <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-spice-text-muted">
        {label}
      </p>

      <p
        className={cn(
          'text-[28px] font-extrabold leading-none tracking-tight text-spice-text-primary',
          !hasOutOf && (valueClassName ?? toneStyles?.value),
        )}
      >
        {hasOutOf ? (
          <>
            <span className={cn(valueClassName ?? toneStyles?.value)}>
              {displayValue}
            </span>
            <span className="text-[15px] font-semibold tracking-normal text-spice-text-muted">
              /{outOf}
            </span>
          </>
        ) : (
          displayValue
        )}
      </p>

      {supportingText ? (
        <p className="mt-1.5 text-[11px] font-medium text-spice-text-muted">
          {supportingText}
        </p>
      ) : null}

      {(hasChange || badgeLabel) && tooltip ? (
        <div className="mt-2 flex items-center gap-2">
          {hasChange ? (
            <span className="text-xs font-semibold text-spice-text-medium">
              {`${change > 0 ? '+' : ''}${change}%`}
            </span>
          ) : null}
          {badgeLabel ? (
            <span className="rounded-full bg-spice-semantic-errorBg px-2 py-0.5 text-[10px] font-semibold text-spice-semantic-error ring-1 ring-spice-semantic-error/25">
              {badgeLabel}
            </span>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};
