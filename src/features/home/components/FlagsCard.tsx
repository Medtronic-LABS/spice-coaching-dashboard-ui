import {
  Button,
  Card,
  ListItem,
  SectionHeader,
  StatusBadge,
} from '@/components/ui';
import { severityToBadgeStatus } from '@/features/home/utils/supervisorBadges';
import { cn } from '@/utils';
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
  title = 'Flags',
  subtitle,
  items,
  primaryActionLabel,
  onPrimaryAction,
  onRowClick,
}: FlagsCardProps) => {
  return (
    <Card variant="elevated">
      <SectionHeader
        title={title}
        subtitle={subtitle}
        action={
          <Button variant="secondary" onClick={onPrimaryAction}>
            {primaryActionLabel}
          </Button>
        }
      />

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
            aria-label={`Flag: ${item.name}`}
          >
            <ListItem
              title={item.name}
              subtitle={
                item.message
                  ? item.details
                    ? `${item.message} • ${item.details}`
                    : item.message
                  : item.flag_type
              }
              rightContent={
                <StatusBadge
                  status={severityToBadgeStatus(item.severity)}
                  label={item.severity}
                />
              }
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
