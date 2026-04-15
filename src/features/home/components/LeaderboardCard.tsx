import { Badge, Card, ListItem, SectionHeader } from '@/components/ui';
import { cn } from '@/utils';
import type { LeaderboardItem } from '@/types/supervisor.types';

function trendLabel(trend: LeaderboardItem['trend']): string {
  switch (trend) {
    case 'up':
      return 'Up';
    case 'down':
      return 'Down';
    case 'flat':
      return 'Flat';
    default:
      return 'Trend';
  }
}

export interface LeaderboardCardProps {
  title?: string;
  subtitle?: string;
  items: LeaderboardItem[];
  onRowClick?: (item: LeaderboardItem) => void;
}

export const LeaderboardCard = ({
  title = 'Leaderboard',
  subtitle,
  items,
  onRowClick,
}: LeaderboardCardProps) => {
  return (
    <Card variant="elevated">
      <SectionHeader title={title} subtitle={subtitle} />

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
            aria-label={`Leaderboard row: ${item.name}`}
          >
            <ListItem
              title={`${item.rank}. ${item.name}`}
              subtitle={`Score: ${item.score} • Completion: ${item.completion_rate}% • ${trendLabel(
                item.trend,
              )}`}
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
