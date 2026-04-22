import { Button, Card, SectionHeader } from '@/components/ui';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils';
import type { LeaderboardItem } from '@/types/supervisor.types';
import { useMemo } from 'react';

export interface LeaderboardCardProps {
  title?: string;
  subtitle?: string;
  items: LeaderboardItem[];
  onRowClick?: (item: LeaderboardItem) => void;
  onViewAll?: () => void;
}

export const LeaderboardCard = ({
  title,
  subtitle,
  items,
  onRowClick,
  onViewAll,
}: LeaderboardCardProps) => {
  const { t } = useTranslation();
  const resolvedTitle =
    title ?? t('home.supervisorDashboard.sections.leaderboard');

  const numberFmt = useMemo(() => new Intl.NumberFormat(), []);

  const initials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] ?? '';
    const b = parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '';
    return (a + b).toUpperCase() || 'CH';
  };

  return (
    <Card variant="elevated">
      <SectionHeader
        title={resolvedTitle}
        subtitle={subtitle}
        action={
          <Button
            variant="ghost"
            onClick={onViewAll}
            className="text-blue-700 hover:bg-blue-50"
          >
            {t('home.dashboard.actions.viewAll')}
          </Button>
        }
      />

      <div className="divide-y divide-slate-200">
        {items.map((item) => (
          <button
            key={item.chw_id}
            type="button"
            onClick={onRowClick ? () => onRowClick(item) : undefined}
            disabled={!onRowClick}
            className={cn(
              'w-full py-3 text-left transition',
              onRowClick
                ? 'cursor-pointer hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2'
                : 'cursor-default',
            )}
            aria-label={t('home.leaderboard.rowAriaLabel', { name: item.name })}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                  {initials(item.name)}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-900">
                    {item.name}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-slate-500">
                    {t('home.dashboard.topPerformance.subtitle', {
                      passRate: item.completion_rate,
                      points: numberFmt.format(item.score),
                    })}
                  </div>
                  {item.courses && item.courses.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.courses.map((course) => (
                        <span
                          key={course}
                          className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700"
                        >
                          {course}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="shrink-0 text-xs font-semibold text-slate-600">
                #{item.rank}
              </div>
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
};
