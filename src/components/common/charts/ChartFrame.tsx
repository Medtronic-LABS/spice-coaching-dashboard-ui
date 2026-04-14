import * as React from 'react';

import { cn } from '@/utils';

export type ChartFrameProps = {
  className?: string;
  style?: React.CSSProperties;
  height?: number;
  width?: number | string;
  loading?: boolean;
  error?: React.ReactNode;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  children?: React.ReactNode;
  legend?: React.ReactNode;
  ariaLabel: string;
  role?: React.AriaRole;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  onMouseMove?: React.MouseEventHandler<HTMLDivElement>;
};

export default function ChartFrame({
  className,
  style,
  height = 300,
  width = '100%',
  loading = false,
  error,
  isEmpty = false,
  emptyTitle = 'No data',
  emptyDescription = 'There is no data to display for the current selection.',
  children,
  legend,
  ariaLabel,
  role = 'img',
  onClick,
  onMouseMove,
}: ChartFrameProps) {
  return (
    <div
      className={cn(
        'relative w-full rounded-xl border border-slate-200 bg-white p-3',
        className,
      )}
      style={{ height, width, ...style }}
      role={role}
      aria-label={ariaLabel}
      onClick={onClick}
      onMouseMove={onMouseMove}
    >
      {loading ? (
        <div className="h-full w-full animate-pulse rounded-lg bg-slate-100" />
      ) : error ? (
        <div className="flex h-full w-full items-center justify-center">
          <div className="max-w-sm text-center">
            <div className="text-sm font-medium text-slate-900">Error</div>
            <div className="mt-1 text-xs text-slate-600">{error}</div>
          </div>
        </div>
      ) : isEmpty ? (
        <div className="flex h-full w-full items-center justify-center">
          <div className="max-w-sm text-center">
            <div className="text-sm font-medium text-slate-900">
              {emptyTitle}
            </div>
            <div className="mt-1 text-xs text-slate-600">
              {emptyDescription}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-full min-h-0 w-full flex-col">
          <div className="flex-1 min-h-0">{children}</div>
          {legend ? <div className="shrink-0">{legend}</div> : null}
        </div>
      )}
    </div>
  );
}
