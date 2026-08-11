import { BadgeImageThumb } from '@/features/badges/components/BadgeImageThumb';
import type { AdminBadge } from '@/features/badges/types/badge.types';
import { assignSequencesByOrder } from '@/features/badges/utils/badgeSequence';
import {
  ReorderDragHandle,
  ReorderableList,
} from '@/features/modules/components/ReorderableList';
import { resolveDisplayText } from '@/config/deploymentLocale';

export interface BadgeSequenceReorderListProps {
  badges: AdminBadge[];
  disabled?: boolean;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

function moduleLabel(badge: AdminBadge): string {
  const titles = (
    badge.modules.length
      ? badge.modules
      : badge.module_ids.map((id) => ({ id, title: {} }))
  ).map((module) => resolveDisplayText(module.title, module.id));
  if (!titles.length) return '—';
  const visible = titles.slice(0, 2);
  const remaining = titles.length - visible.length;
  return remaining > 0
    ? `${visible.join(', ')} +${remaining}`
    : visible.join(', ');
}

export function BadgeSequenceReorderList({
  badges,
  disabled = false,
  onReorder,
}: BadgeSequenceReorderListProps) {
  const displayBadges = assignSequencesByOrder(badges);

  return (
    <div className="space-y-1 p-2">
      <div className="hidden gap-1 px-1 text-xs font-semibold uppercase tracking-wide text-spice-text-muted sm:grid sm:grid-cols-[auto_3rem_minmax(10rem,1.2fr)_minmax(12rem,1.3fr)]">
        <span className="w-8" aria-hidden="true" />
        <span>Seq</span>
        <span>Milestone</span>
        <span>Modules</span>
      </div>
      <ReorderableList
        items={displayBadges}
        disabled={disabled}
        getItemId={(badge) => badge.id}
        onReorder={onReorder}
        rowVariant="plain"
        renderItem={(badge, _index, controls) => (
          <div className="flex min-w-0 items-start gap-1 rounded-xl bg-spice-bg-surface p-1 ring-1 ring-spice-border/70 sm:items-center">
            <ReorderDragHandle dragHandleProps={controls.dragHandleProps} />
            <div className="grid min-w-0 flex-1 gap-1 sm:grid-cols-[3rem_minmax(10rem,1.2fr)_minmax(12rem,1.3fr)] sm:items-center sm:gap-1">
              <span className="font-medium tabular-nums text-spice-text-primary">
                {badge.sequence ?? '—'}
              </span>
              <div className="flex min-w-0 items-center gap-2">
                <BadgeImageThumb
                  storagePath={badge.image_storage_path}
                  alt={`${badge.name} milestone`}
                  className="shrink-0"
                />
                <span className="truncate font-medium text-spice-text-primary">
                  {badge.name}
                </span>
              </div>
              <span
                className="line-clamp-2 text-sm text-spice-text-medium"
                title={moduleLabel(badge)}
              >
                {moduleLabel(badge)}
              </span>
            </div>
          </div>
        )}
      />
    </div>
  );
}
