import * as React from 'react';

import { cn } from '@/utils';

export type LegendItem = {
  label: React.ReactNode;
  color?: string;
  key: string | number;
};

export type ResponsiveLegendProps = {
  items?: readonly LegendItem[];
  className?: string;
  ariaLabel?: string;
};

export function ResponsiveLegend({
  items,
  className,
  ariaLabel = 'Chart legend',
}: ResponsiveLegendProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className={cn('w-full min-w-0', className)}>
      <div
        className="flex flex-wrap items-center justify-center gap-2"
        role="list"
        aria-label={ariaLabel}
      >
        {items.map((item) => (
          <div
            key={String(item.key)}
            className="flex min-w-0 max-w-full items-center gap-2 text-xs text-slate-600 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            role="listitem"
            tabIndex={0}
            aria-label={typeof item.label === 'string' ? item.label : undefined}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: item.color ?? '#94A3B8' }}
              aria-hidden="true"
            />
            <span className="min-w-0 break-words">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
