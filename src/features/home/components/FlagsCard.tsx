import { Button, Card, SectionHeader } from '@/components/ui';
import { useTranslation } from 'react-i18next';
import type { PerformanceAlertItem } from '@/types/supervisor.types';

export interface FlagsCardProps {
  title?: string;
  subtitle?: string;
  items: PerformanceAlertItem[];
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  onRowClick?: (item: PerformanceAlertItem) => void;
  onAssignModule?: (item: PerformanceAlertItem) => void;
  onViewProfile?: (item: PerformanceAlertItem) => void;
}

export const FlagsCard = ({
  title,
  subtitle,
  items,
  primaryActionLabel,
  onPrimaryAction,
  onAssignModule,
  onViewProfile,
}: FlagsCardProps) => {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t('home.supervisorDashboard.sections.flags');

  const severityMeta = (severity: PerformanceAlertItem['severity']) => {
    switch (severity) {
      case 'high':
        return {
          label: t('home.dashboard.flags.severity.critical'),
          pill: 'bg-spice-semantic-errorBg text-spice-semantic-error ring-1 ring-spice-semantic-error/25',
          accent: 'border-l-[color:var(--color-error)]',
        };
      case 'medium':
        return {
          label: t('home.dashboard.flags.severity.warning'),
          pill: 'bg-spice-semantic-warningBg text-spice-semantic-warning ring-1 ring-spice-semantic-warning/25',
          accent: 'border-l-[color:var(--color-warning)]',
        };
      default:
        return {
          label: t('home.dashboard.flags.severity.info'),
          pill: 'bg-spice-semantic-infoBg text-spice-semantic-info ring-1 ring-spice-border',
          accent: 'border-l-spice-border-mid',
        };
    }
  };

  const dueLabel = (item: PerformanceAlertItem) => {
    if (typeof item.last_active_days !== 'number') return undefined;
    if (item.last_active_days <= 0) return t('home.dashboard.flags.dueToday');
    return t('home.dashboard.flags.overdueDays', {
      days: item.last_active_days,
    });
  };

  return (
    <Card variant="elevated">
      <SectionHeader
        title={resolvedTitle}
        subtitle={subtitle}
        action={
          <Button
            variant="ghost"
            onClick={onPrimaryAction}
            className="text-spice-brand-primary hover:bg-spice-bg-tint"
          >
            {primaryActionLabel}
          </Button>
        }
      />

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.chw_id}
            className={`rounded-xl border border-spice-border bg-spice-bg-surface p-3 border-l-4 ${severityMeta(item.severity).accent}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${severityMeta(item.severity).pill}`}
                >
                  {severityMeta(item.severity).label}
                </span>

                <div className="mt-2 text-sm font-semibold text-spice-text-primary">
                  {item.name}
                </div>
                <div className="mt-1 text-xs text-spice-text-medium">
                  {item.message
                    ? item.details
                      ? `${item.message} • ${item.details}`
                      : item.message
                    : item.flag_type}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    className="h-8 px-3 text-xs"
                    onClick={() => onAssignModule?.(item)}
                  >
                    {t('home.dashboard.flags.actions.assignModule')}
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-8 px-3 text-xs"
                    onClick={() => onViewProfile?.(item)}
                  >
                    {t('home.dashboard.flags.actions.viewProfile')}
                  </Button>
                </div>
              </div>

              {dueLabel(item) ? (
                <div className="shrink-0 text-[10px] font-semibold text-spice-text-muted">
                  {dueLabel(item)}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
