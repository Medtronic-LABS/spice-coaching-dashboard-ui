import { Card, SectionHeader, StatusBadge } from '@/components/ui';
import { ProgressBar } from '@/components/common/ProgressBar';
import { statusToBadge } from '@/features/home/utils/supervisorBadges';
import { cn } from '@/utils';
import type { ModuleProgressItem } from '@/types/supervisor.types';

export interface ModuleProgressCardProps {
  title?: string;
  subtitle?: string;
  items: ModuleProgressItem[];
  onRowClick?: (item: ModuleProgressItem) => void;
}

export const ModuleProgressCard = ({
  title = 'Module progress',
  subtitle,
  items,
  onRowClick,
}: ModuleProgressCardProps) => {
  return (
    <Card variant="elevated">
      <SectionHeader title={title} subtitle={subtitle} />

      <div className="space-y-3">
        {items.map((item) => {
          const mapped = statusToBadge(item.status);

          return (
            <button
              key={item.module_id}
              type="button"
              onClick={onRowClick ? () => onRowClick(item) : undefined}
              disabled={!onRowClick}
              className={cn(
                'w-full rounded-lg border border-slate-200 bg-white p-3 text-left transition-all',
                onRowClick
                  ? 'hover:-translate-y-px hover:shadow-sm'
                  : undefined,
                onRowClick
                  ? 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2'
                  : undefined,
              )}
              aria-label={`Module: ${item.name}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {item.name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {item.progress}% completion - {item.completed}/{item.total}
                  </p>
                </div>
                <StatusBadge status={mapped.badge} label={mapped.label} />
              </div>

              <div className="mt-3">
                <ProgressBar value={item.progress} />
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
};
