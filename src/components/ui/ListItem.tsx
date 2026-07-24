import { type ReactNode } from 'react';
import { cn } from '@/utils';

/**
 * ListItem
 * Reusable row item with title, optional subtitle, and trailing content.
 *
 * Usage:
 * <ListItem title="Name" subtitle="Additional info" rightContent={<Badge>New</Badge>} />
 */
export interface ListItemProps {
  title: string;
  subtitle?: string;
  rightContent?: ReactNode;
  className?: string;
}

export const ListItem = ({
  title,
  subtitle,
  rightContent,
  className,
}: ListItemProps) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-lg border border-spice-border bg-spice-bg-surface p-3',
        className,
      )}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-spice-text-primary">
          {title}
        </p>
        {subtitle ? (
          <p className="truncate text-xs text-spice-text-muted">{subtitle}</p>
        ) : null}
      </div>
      {rightContent ? <div className="shrink-0">{rightContent}</div> : null}
    </div>
  );
};
