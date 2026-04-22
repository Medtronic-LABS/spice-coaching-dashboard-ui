import { Badge, Card, ListItem, SectionHeader } from '@/components/ui';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils';
import type { LeaderboardItem } from '@/types/supervisor.types';

export interface LeaderboardCardProps {
  title?: string;
  subtitle?: string;
  items: LeaderboardItem[];
  onRowClick?: (item: LeaderboardItem) => void;
}

export const LeaderboardCard = ({
  title,
  subtitle,
  items,
  onRowClick,
}: LeaderboardCardProps) => {
  const { t } = useTranslation();
  const resolvedTitle =
    title ?? t('home.supervisorDashboard.sections.leaderboard');

  const trendLabel = (trend: LeaderboardItem['trend']): string => {
    switch (trend) {
      case 'up':
        return t('trend.up');
      case 'down':
        return t('trend.down');
      case 'flat':
        return t('trend.flat');
      default:
        return t('trend.unknown');
    }
  };

  return (
    <Card variant="elevated">
      <SectionHeader title={resolvedTitle} subtitle={subtitle} />

      <div className="space-y-2">
        {items.map((item) => (
          <button
            key={item.chw_id}
            type="button"
            onClick={onRowClick ? () => onRowClick(item) : undefined}
            disabled={!onRowClick}
            className={cn(
              'block w-full text-left',
              onRowClick
                ? 'cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2'
                : 'cursor-default',
            )}
            aria-label={t('home.leaderboard.rowAriaLabel', { name: item.name })}
          >
            <ListItem
              title={`${item.rank}. ${item.name}`}
              subtitle={t('home.leaderboard.subtitle', {
                score: item.score,
                completion: item.completion_rate,
                trend: trendLabel(item.trend),
              })}
              rightContent={<Badge>{`${item.score}`}</Badge>}
              className={cn(
                'transition-all',
                onRowClick
                  ? 'hover:-translate-y-px hover:shadow-sm'
                  : undefined,
              )}
            />
          </button>
        ))}
      </div>
    </Card>
  );
};
