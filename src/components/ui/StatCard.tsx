import type { ReactNode } from 'react';
import { Tooltip } from '@/components/ui/Tooltip';
import { typographyClasses } from '@/components/ui/typographyClasses';
import { cn } from '@/utils';

/**
 * StatCard
 * KPI card for displaying a metric value and optional numeric change.
 *
 * Layout: icon + label header; value anchored bottom-right (optional /outOf).
 * Accent styling uses a top border (`border-t-4`) for dashboard metrics.
 *
 * Usage:
 * <StatCard label="Completion Rate" value="68%" change={5} />
 * <StatCard tone="pink" label="Responsive SKs" value={127} outOf={155} tooltip="..." />
 */
export type StatCardTone =
  | 'pink'
  | 'amber'
  | 'blue'
  | 'green'
  | 'violet'
  | 'purple';

export interface StatCardProps {
  /** Optional icon shown beside the label. */
  icon?: ReactNode;
  /** Metric label shown in the header row (right of the icon). */
  label: string;
  /** Primary metric value shown bottom-right. */
  value: string | number;
  /** Optional denominator for fraction display (`value/outOf`). */
  outOf?: string | number;
  /** Optional trend delta in percentage points. */
  change?: number;
  /** Optional helper line under the value. */
  supportingText?: string;
  /** Optional badge text (e.g. ALERT). */
  badgeLabel?: string;
  /** Optional classes for the metric label (e.g. `whitespace-nowrap`). */
  labelClassName?: string;
  /** Optional override for the main value color/tone. */
  valueClassName?: string;
  /**
   * When true, the value may shrink/wrap (e.g. multi-line datetimes)
   * instead of forcing `shrink-0`. Pair with `whitespace-pre-line` on
   * `valueClassName` when the value contains intentional line breaks.
   */
  allowValueWrap?: boolean;
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
    border: 'border-t-spice-palette-pink',
    iconBg: 'bg-spice-palette-pinkLt',
    iconFg: 'text-spice-palette-pink',
    value: 'text-spice-palette-pink',
  },
  amber: {
    border: 'border-t-spice-palette-amber',
    iconBg: 'bg-spice-palette-amberLt',
    iconFg: 'text-spice-palette-amber',
    value: 'text-spice-palette-amber',
  },
  blue: {
    border: 'border-t-spice-palette-blue',
    iconBg: 'bg-spice-palette-blueLt',
    iconFg: 'text-spice-palette-blue',
    value: 'text-spice-palette-blue',
  },
  green: {
    border: 'border-t-spice-palette-green',
    iconBg: 'bg-spice-palette-greenLt',
    iconFg: 'text-spice-palette-green',
    value: 'text-spice-palette-green',
  },
  violet: {
    border: 'border-t-spice-palette-violet',
    iconBg: 'bg-spice-palette-violetLt',
    iconFg: 'text-spice-palette-violet',
    value: 'text-spice-palette-violet',
  },
  purple: {
    border: 'border-t-spice-palette-purple',
    iconBg: 'bg-spice-palette-purpleLt',
    iconFg: 'text-spice-palette-purple',
    value: 'text-spice-palette-purple',
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
  labelClassName,
  valueClassName,
  allowValueWrap = false,
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
        'relative flex h-full min-w-[160px] flex-1 flex-col overflow-hidden rounded-xl border border-spice-border bg-spice-bg-surface p-4 shadow-spiceKpi transition-all hover:shadow-md',
        toneStyles ? cn('border-t-4', toneStyles.border) : null,
      )}
    >
      {tooltip ? (
        <div className="absolute right-3 top-3 z-10">
          <Tooltip
            label={tooltipLabel ?? label}
            content={tooltip}
            placement="bottom"
            className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-spice-border bg-spice-bg-surface text-xs font-bold leading-none text-spice-text-muted transition-colors hover:border-spice-brand-primary hover:text-spice-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spice-brand-primary/30"
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
            <span className="rounded-full bg-spice-semantic-errorBg px-2 py-0.5 text-xs font-semibold text-spice-semantic-error ring-1 ring-spice-semantic-error/25">
              {badgeLabel}
            </span>
          ) : null}
        </div>
      ) : null}

      <div
        className={cn(
          'flex items-start gap-3',
          tooltip || hasChange || badgeLabel ? 'pr-7' : null,
        )}
      >
        {icon ? (
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full [&_svg]:h-5 [&_svg]:w-5',
              toneStyles?.iconBg ?? 'bg-spice-bg-tint',
              toneStyles?.iconFg ?? 'text-spice-text-muted',
            )}
          >
            {icon}
          </div>
        ) : null}

        <p
          className={cn(
            'min-w-0 flex-1 break-words pt-1 leading-snug',
            typographyClasses.kpiLabel,
            labelClassName,
          )}
        >
          {label}
        </p>
      </div>

      <p
        className={cn(
          'mt-auto pt-1 text-right',
          typographyClasses.kpiValue,
          allowValueWrap ? 'min-w-0' : 'shrink-0',
          !hasOutOf && (valueClassName ?? toneStyles?.value),
        )}
      >
        {hasOutOf ? (
          <>
            <span className={cn(valueClassName ?? toneStyles?.value)}>
              {displayValue}
            </span>
            <span className={typographyClasses.kpiOutOf}>{`/${outOf}`}</span>
          </>
        ) : (
          displayValue
        )}
      </p>

      {supportingText ? (
        <p className="mt-2 text-xs font-medium text-spice-text-muted">
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
            <span className="rounded-full bg-spice-semantic-errorBg px-2 py-0.5 text-xs font-semibold text-spice-semantic-error ring-1 ring-spice-semantic-error/25">
              {badgeLabel}
            </span>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};
