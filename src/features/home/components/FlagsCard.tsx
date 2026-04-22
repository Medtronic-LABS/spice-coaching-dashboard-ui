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
}

export const FlagsCard = ({
  title,
  subtitle,
  items,
  primaryActionLabel,
  onPrimaryAction,
}: FlagsCardProps) => {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t('home.supervisorDashboard.sections.flags');

  const severityMeta = (severity: PerformanceAlertItem['severity']) => {
    switch (severity) {
      case 'high':
        return {
          label: t('home.dashboard.flags.severity.critical'),
          pill: 'bg-red-50 text-red-700',
          accent: 'border-l-red-700',
        };
      case 'medium':
        return {
          label: t('home.dashboard.flags.severity.warning'),
          pill: 'bg-amber-50 text-amber-700',
          accent: 'border-l-amber-500',
        };
      default:
        return {
          label: t('home.dashboard.flags.severity.info'),
          pill: 'bg-slate-50 text-slate-700',
          accent: 'border-l-slate-300',
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
            className="text-blue-700 hover:bg-blue-50"
          >
            {primaryActionLabel}
          </Button>
        }
      />

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.chw_id}
            className={`rounded-xl border border-slate-200 bg-white p-3 border-l-4 ${severityMeta(item.severity).accent}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${severityMeta(item.severity).pill}`}
                >
                  {severityMeta(item.severity).label}
                </span>

                <div className="mt-2 text-sm font-semibold text-slate-900">
                  {item.name}
                </div>
                <div className="mt-1 text-xs text-slate-600">
                  {item.message
                    ? item.details
                      ? `${item.message} • ${item.details}`
                      : item.message
                    : item.flag_type}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    className="h-8 px-3 text-xs"
                    onClick={() => undefined}
                  >
                    {t('home.dashboard.flags.actions.assignModule')}
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-8 px-3 text-xs"
                    onClick={() => undefined}
                  >
                    {t('home.dashboard.flags.actions.viewProfile')}
                  </Button>
                </div>
              </div>

              {dueLabel(item) ? (
                <div className="shrink-0 text-[10px] font-semibold text-slate-500">
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
