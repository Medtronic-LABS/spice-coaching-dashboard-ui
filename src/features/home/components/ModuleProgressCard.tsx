import { Button, Card, SectionHeader } from '@/components/ui';
import { ProgressBar } from '@/components/common/ProgressBar';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils';
import type { ModuleProgressItem } from '@/types/supervisor.types';

export interface ModuleProgressCardProps {
  title?: string;
  subtitle?: string;
  items: ModuleProgressItem[];
  onRowClick?: (item: ModuleProgressItem) => void;
  onNew?: () => void;
}

export const ModuleProgressCard = ({
  title,
  subtitle,
  items,
  onRowClick,
  onNew,
}: ModuleProgressCardProps) => {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t('home.supervisorDashboard.sections.modules');

  const statusLabel = (status: ModuleProgressItem['status']) => {
    switch (status) {
      case 'on_track':
        return t('home.dashboard.modules.status.complete');
      case 'on_time':
      case 'due_soon':
        return t('home.dashboard.modules.status.inProgress');
      case 'delayed':
      case 'inactive':
        return t('home.dashboard.modules.status.overdue');
      default:
        return t('status.unknown');
    }
  };

  return (
    <Card variant="elevated">
      <SectionHeader
        title={resolvedTitle}
        subtitle={subtitle}
        action={
          <Button
            variant="secondary"
            onClick={() => (onNew ? onNew() : undefined)}
          >
            {t('home.dashboard.modules.actions.new')}
          </Button>
        }
      />

      <div className="divide-y divide-spice-border">
        {items.map((item) => {
          const pctClass =
            item.status === 'delayed'
              ? 'text-spice-semantic-error'
              : 'text-spice-text-medium';
          const barClass =
            item.status === 'delayed'
              ? 'bg-spice-semantic-error'
              : 'bg-spice-brand-primary';

          const content = (
            <div className="py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-medium text-spice-text-primary">
                  {item.name}
                </p>
                <div className={cn('text-sm font-semibold', pctClass)}>
                  {item.progress}%
                </div>
              </div>
              <div className="mt-1 flex items-center justify-between gap-3 text-xs text-spice-text-muted">
                <span>
                  {t('home.dashboard.modules.rowMeta', {
                    completed: item.completed,
                    total: item.total,
                  })}
                </span>
                <span>{statusLabel(item.status)}</span>
              </div>
              <div className="mt-2">
                <ProgressBar value={item.progress} barClassName={barClass} />
              </div>
            </div>
          );

          return onRowClick ? (
            <button
              key={item.module_id}
              type="button"
              onClick={() => onRowClick(item)}
              className={cn(
                'w-full text-left transition',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spice-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-spice-bg-dashboard',
              )}
              aria-label={t('home.modules.rowAriaLabel', { name: item.name })}
            >
              {content}
            </button>
          ) : (
            <div key={item.module_id}>{content}</div>
          );
        })}
      </div>
    </Card>
  );
};
