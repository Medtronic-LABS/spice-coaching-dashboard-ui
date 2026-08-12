import { cn } from '@/utils';

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded bg-spice-bg-tint', className)}
      aria-hidden
    />
  );
}

export function DashboardKpiSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {Array.from({ length: 5 }, (_, index) => (
        <div
          key={index}
          className="min-w-[160px] flex-1 space-y-3 rounded-md border border-spice-border bg-spice-bg-surface px-5 py-4 shadow-spiceKpi"
        >
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="h-7 w-16" />
        </div>
      ))}
    </div>
  );
}

export function DashboardTableSkeleton({
  rows = 5,
  columns = 3,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="space-y-0 overflow-hidden">
      <div className="flex gap-4 bg-spice-brand-primary/10 px-4 py-3">
        {Array.from({ length: columns }, (_, index) => (
          <SkeletonBlock key={index} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex gap-4 border-t border-spice-border px-4 py-3"
        >
          {Array.from({ length: columns }, (_, colIndex) => (
            <SkeletonBlock
              key={colIndex}
              className={cn('h-4 flex-1', colIndex === 0 && 'max-w-[40%]')}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function DashboardListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <ul className="space-y-3">
      {Array.from({ length: rows }, (_, index) => (
        <li key={index} className="space-y-2">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-3 w-4 shrink-0" />
            <SkeletonBlock className="h-4 flex-1" />
            <SkeletonBlock className="h-4 w-10 shrink-0" />
          </div>
          <SkeletonBlock className="h-2 w-full" />
        </li>
      ))}
    </ul>
  );
}

export function DashboardHierarchySkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div>
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 border-b border-spice-border/70 px-4 py-3 last:border-b-0"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <SkeletonBlock className="h-10 w-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonBlock className="h-4 w-32" />
              <SkeletonBlock className="h-3 w-20" />
            </div>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-6">
            <SkeletonBlock className="h-4 w-[4.5rem]" />
            <SkeletonBlock className="h-4 w-[5.5rem]" />
            <SkeletonBlock className="h-4 w-[6.5rem]" />
            <SkeletonBlock className="h-6 w-[5.75rem] rounded-full" />
            <SkeletonBlock className="h-9 w-[7.25rem] rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
