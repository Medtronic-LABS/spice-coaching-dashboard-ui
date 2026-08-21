import { type ReactNode } from 'react';
import { Card } from '@/components/ui';
import { DashboardWidgetRefreshButton } from '@/features/admin-dashboard/components/DashboardWidgetRefreshButton';
import { cn } from '@/utils';

export type DashboardWidgetShellSize = 'md' | 'lg' | 'xl' | 'xxl';

interface DashboardWidgetShellProps {
  title: string;
  description?: string;
  /** Right-side header controls (sort, search, actions). */
  actions?: ReactNode;
  /**
   * When set, appends the shared refresh control after `actions`.
   * Prefer this over a one-off refresh button in each widget.
   */
  onRefresh?: () => void;
  /** Disables refresh and spins the icon while the widget query is fetching. */
  isRefreshing?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  /**
   * Edge-to-edge body (tables / hierarchy lists).
   * Header keeps the same inset as padded widgets; body manages horizontal padding.
   */
  flush?: boolean;
  /**
   * Caps widget height; body scrolls when content overflows.
   * `md` (~28rem) for paired row widgets; `lg` (~32rem) for full-width lists;
   * `xl` (~40rem) for denser multi-section widgets (e.g. document usage).
   */
  size?: DashboardWidgetShellSize;
  /** Header-only layout without a growing scroll body (e.g. collapsed widgets). */
  compact?: boolean;
  className?: string;
}

const SIZE_MAX_HEIGHT: Record<DashboardWidgetShellSize, string> = {
  md: 'max-h-[28rem]',
  lg: 'max-h-[32rem]',
  xl: 'max-h-[40rem]',
  xxl: 'max-h-[50rem]',
};

/**
 * Shared chrome for admin-dashboard widgets: consistent title,
 * description, padding, optional header actions, and a scrollable body
 * under a shared max-height (so paired-row widgets can stretch equally).
 */
export const DashboardWidgetShell = ({
  title,
  description,
  actions,
  onRefresh,
  isRefreshing = false,
  children,
  footer,
  flush = false,
  size = 'md',
  compact = false,
  className,
}: DashboardWidgetShellProps) => {
  const hasHeaderControls = Boolean(actions) || Boolean(onRefresh);

  return (
    <Card
      className={cn(
        'flex min-h-0 flex-col overflow-hidden border border-spice-border shadow-spiceCard',
        !compact && 'h-full',
        !compact && SIZE_MAX_HEIGHT[size],
        // Explicitly override Card's default `p-4 md:p-6` at all breakpoints.
        flush ? 'p-0 md:p-0' : 'p-4 md:p-4',
        className,
      )}
    >
      <div
        className={cn(
          'flex shrink-0 flex-wrap items-start justify-between gap-3',
          flush ? 'px-4 pt-4' : null,
        )}
      >
        <div className="min-w-0 flex-1">
          <h3 className="text-[13px] font-semibold text-spice-text-primary">
            {title}
          </h3>
          {description ? (
            <p className="mt-1 text-[11px] font-normal text-spice-text-muted">
              {description}
            </p>
          ) : null}
        </div>
        {hasHeaderControls ? (
          <div className="flex max-w-full shrink-0 flex-wrap items-center justify-end gap-2">
            {actions}
            {onRefresh ? (
              <DashboardWidgetRefreshButton
                onRefresh={onRefresh}
                isRefreshing={isRefreshing}
              />
            ) : null}
          </div>
        ) : null}
      </div>
      <div
        className={cn(
          'mt-3 min-h-0 overflow-y-auto',
          compact ? 'shrink-0' : 'flex-1',
          !flush && 'space-y-3',
        )}
      >
        {children}
      </div>
      {footer ? (
        <div className={cn('mt-3 shrink-0', flush && 'px-4 pb-4')}>
          {footer}
        </div>
      ) : null}
    </Card>
  );
};
