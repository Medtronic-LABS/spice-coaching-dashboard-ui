import { TruncatedText } from '@/components/ui';
import { TABLE_CELL_LABEL_MAX_LENGTH } from '@/constants/fieldLimits';
import { BadgeImageThumb } from '@/features/badges/components/BadgeImageThumb';
import type { AdminBadge } from '@/features/badges/types/badge.types';
import { assignSequencesByOrder } from '@/features/badges/utils/badgeSequence';
import {
  ReorderDragHandle,
  ReorderableList,
} from '@/components/shared/ReorderableList';
import { resolveDisplayText } from '@/config/deploymentLocale';

export interface BadgeSequenceReorderListProps {
  badges: AdminBadge[];
  disabled?: boolean;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

function moduleTitles(badge: AdminBadge): string[] {
  return (
    badge.modules.length
      ? badge.modules
      : badge.module_ids.map((id) => ({ id, title: {} }))
  ).map((module) => resolveDisplayText(module.title, module.id));
}

export function BadgeSequenceReorderList({
  badges,
  disabled = false,
  onReorder,
}: BadgeSequenceReorderListProps) {
  const displayBadges = assignSequencesByOrder(badges);

  return (
    <div className="space-y-3">
      <div className="hidden rounded-t-xl bg-spice-bg-tint px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-spice-text-medium sm:grid sm:grid-cols-[auto_3rem_minmax(10rem,1.2fr)_minmax(12rem,1.3fr)] sm:gap-1 sm:px-6 sm:py-2">
        <span className="w-8" aria-hidden="true" />
        <span>Seq</span>
        <span>Milestone</span>
        <span>Modules</span>
      </div>
      <div className="px-2 pb-2">
        <ReorderableList
          items={displayBadges}
          disabled={disabled}
          getItemId={(badge) => badge.id}
          onReorder={onReorder}
          rowVariant="plain"
          renderItem={(badge, _index, controls) => {
            const titles = moduleTitles(badge);
            const label = titles.join(', ');
            return (
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
                    <div className="min-w-0 flex-1">
                      <TruncatedText
                        text={badge.name}
                        maxChars={TABLE_CELL_LABEL_MAX_LENGTH}
                        focusable
                        className="font-medium text-spice-text-primary"
                      />
                    </div>
                  </div>
                  <div className="min-w-0">
                    {titles.length ? (
                      <TruncatedText
                        text={label}
                        maxChars={TABLE_CELL_LABEL_MAX_LENGTH}
                        focusable
                        className="text-sm text-spice-text-medium"
                      />
                    ) : (
                      <span className="text-sm text-spice-text-muted">—</span>
                    )}
                  </div>
                </div>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
